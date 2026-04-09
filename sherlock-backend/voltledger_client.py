"""
VoltLedger Bridge Client - HTTP client for VoltLedger API integration
Provides connection to VoltLedger backend with retry logic and caching
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import aiohttp
from pydantic import BaseModel, Field


class ConnectionStatus(str, Enum):
    """Bridge connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    CONNECTING = "connecting"


class LoanStatus(str, Enum):
    """VoltLedger loan status"""
    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    DEFAULTED = "defaulted"
    REJECTED = "rejected"


@dataclass
class CacheEntry:
    """Cached data with TTL"""
    data: Any
    timestamp: datetime
    ttl_seconds: int = 30
    
    def is_valid(self) -> bool:
        """Check if cache entry is still valid"""
        return (datetime.utcnow() - self.timestamp).total_seconds() < self.ttl_seconds


@dataclass  
class VoltLedgerConfig:
    """Configuration for VoltLedger client"""
    base_url: str = "http://localhost:5000"
    api_prefix: str = "/api"
    polling_interval: int = 30  # seconds
    max_retries: int = 5
    retry_delay: float = 1.0  # initial retry delay
    retry_backoff: float = 2.0  # exponential backoff multiplier
    request_timeout: float = 10.0
    cache_ttl: int = 30  # Cache TTL in seconds


class VoltLedgerHealth(BaseModel):
    """VoltLedger health check response"""
    status: str = "unknown"
    database: str = "unknown"
    services: Dict[str, str] = Field(default_factory=dict)
    version: str = "unknown"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VoltLedgerLoan(BaseModel):
    """VoltLedger loan data"""
    id: str
    customer_id: str
    bike_id: str
    amount: float
    status: LoanStatus
    created_at: datetime
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: float = 0.0  # Repayment progress 0-100
    metadata: Dict = Field(default_factory=dict)


class VoltLedgerBike(BaseModel):
    """VoltLedger bike data"""
    id: str
    model: str
    serial_number: str
    status: str  # available, assigned, maintenance, retired
    assigned_loan_id: Optional[str] = None
    battery_health: float = 100.0
    mileage: float = 0.0
    last_maintenance: Optional[datetime] = None
    location: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)


class VoltLedgerSummary(BaseModel):
    """VoltLedger loans summary"""
    total_loans: int = 0
    active_loans: int = 0
    pending_loans: int = 0
    completed_loans: int = 0
    defaulted_loans: int = 0
    total_amount: float = 0.0
    total_repaid: float = 0.0
    default_rate: float = 0.0
    avg_loan_duration_days: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VoltLedgerMetrics(BaseModel):
    """Aggregated VoltLedger metrics for telemetry"""
    connection_status: ConnectionStatus = ConnectionStatus.DISCONNECTED
    last_sync: Optional[datetime] = None
    health: Optional[VoltLedgerHealth] = None
    summary: Optional[VoltLedgerSummary] = None
    bikes: List[VoltLedgerBike] = Field(default_factory=list)
    recent_loans: List[VoltLedgerLoan] = Field(default_factory=list)
    
    # Calculated metrics for agent efficiency
    processing_rate: float = 0.0  # loans processed per hour
    agent_efficiency_score: float = 0.0  # 0-100 score
    bikes_available: int = 0
    bikes_assigned: int = 0
    bikes_maintenance: int = 0
    
    # Correlation metrics
    pending_tasks_correlation: float = 0.0
    agent_workload_indicator: float = 0.0  # 0-100


class VoltLedgerClient:
    """
    HTTP client for VoltLedger API with exponential backoff retry logic.
    
    Features:
    - Polling with configurable intervals
    - Exponential backoff for errors
    - Response caching with TTL
    - Async/await support
    """
    
    def __init__(self, config: Optional[VoltLedgerConfig] = None):
        self.config = config or VoltLedgerConfig()
        self._session: Optional[aiohttp.ClientSession] = None
        self._cache: Dict[str, CacheEntry] = {}
        self._metrics = VoltLedgerMetrics()
        self._callbacks: List[Callable[[VoltLedgerMetrics], None]] = []
        self._polling_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        self._last_sync_time: Optional[datetime] = None
        self._sync_count: int = 0
    
    async def initialize(self):
        """Initialize the client session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.request_timeout),
                headers={"Content-Type": "application/json"}
            )
    
    async def close(self):
        """Close the client session"""
        if self._polling_task:
            self._polling_task.cancel()
            try:
                await self._polling_task
            except asyncio.CancelledError:
                pass
        
        if self._session and not self._session.closed:
            await self._session.close()
    
    def on_update(self, callback: Callable[[VoltLedgerMetrics], None]):
        """Register callback for metrics updates"""
        self._callbacks.append(callback)
    
    def _notify_callbacks(self):
        """Notify all registered callbacks"""
        for callback in self._callbacks:
            try:
                callback(self._metrics)
            except Exception:
                pass  # Ignore callback errors
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached data if valid"""
        if key in self._cache:
            entry = self._cache[key]
            if entry.is_valid():
                return entry.data
            del self._cache[key]
        return None
    
    def _set_cached(self, key: str, data: Any, ttl: Optional[int] = None):
        """Cache data with TTL"""
        self._cache[key] = CacheEntry(
            data=data,
            timestamp=datetime.utcnow(),
            ttl_seconds=ttl or self.config.cache_ttl
        )
    
    async def _make_request(
        self, 
        endpoint: str, 
        method: str = "GET",
        use_cache: bool = True
    ) -> Optional[Dict]:
        """
        Make HTTP request with exponential backoff retry logic
        """
        await self.initialize()
        
        cache_key = f"{method}:{endpoint}"
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached:
                return cached
        
        url = f"{self.config.base_url}{self.config.api_prefix}{endpoint}"
        
        retry_delay = self.config.retry_delay
        last_error = None
        
        for attempt in range(self.config.max_retries):
            try:
                async with self._session.request(method, url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if use_cache:
                            self._set_cached(cache_key, data)
                        return data
                    elif response.status in [502, 503, 504]:  # Gateway errors
                        # Retry on server errors
                        pass
                    else:
                        # Client errors - don't retry
                        return None
                        
            except aiohttp.ClientError as e:
                last_error = e
            except asyncio.TimeoutError:
                last_error = Exception("Request timeout")
            except Exception as e:
                last_error = e
            
            # Wait before retry with exponential backoff
            if attempt < self.config.max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay *= self.config.retry_backoff
        
        # All retries exhausted
        return None
    
    async def get_health(self) -> Optional[VoltLedgerHealth]:
        """Fetch health status from VoltLedger"""
        data = await self._make_request("/health", use_cache=False)
        if data:
            return VoltLedgerHealth(**data)
        return None
    
    async def get_loans_summary(self) -> Optional[VoltLedgerSummary]:
        """Fetch loans summary from VoltLedger"""
        data = await self._make_request("/loans/summary")
        if data:
            return VoltLedgerSummary(**data)
        return None
    
    async def get_bikes_status(self) -> List[VoltLedgerBike]:
        """Fetch bikes status from VoltLedger"""
        data = await self._make_request("/bikes/status")
        if data and isinstance(data, list):
            return [VoltLedgerBike(**bike) for bike in data]
        elif data and isinstance(data, dict) and "bikes" in data:
            return [VoltLedgerBike(**bike) for bike in data["bikes"]]
        return []
    
    async def get_recent_loans(self, limit: int = 10) -> List[VoltLedgerLoan]:
        """Fetch recent loans from VoltLedger"""
        data = await self._make_request(f"/loans?limit={limit}")
        if data:
            if isinstance(data, list):
                return [VoltLedgerLoan(**loan) for loan in data]
            elif isinstance(data, dict) and "loans" in data:
                return [VoltLedgerLoan(**loan) for loan in data["loans"]]
        return []
    
    def _calculate_efficiency_score(self, summary: VoltLedgerSummary) -> float:
        """
        Calculate agent efficiency score based on loan processing metrics
        """
        if summary.total_loans == 0:
            return 50.0  # Neutral score when no data
        
        # Factors:
        # - Completion rate (40%)
        # - Low default rate (30%) 
        # - Processing speed (30%)
        
        completion_rate = summary.completed_loans / max(summary.total_loans, 1)
        default_penalty = max(0, 1 - (summary.defaulted_loans * 2 / max(summary.total_loans, 1)))
        
        # Normalize avg duration (assume optimal is 30 days or less)
        if summary.avg_loan_duration_days > 0:
            speed_score = min(1.0, 30 / summary.avg_loan_duration_days)
        else:
            speed_score = 0.5
        
        score = (
            completion_rate * 40 +
            default_penalty * 30 +
            speed_score * 30
        )
        
        return min(100.0, max(0.0, score))
    
    def _calculate_processing_rate(self, summary: VoltLedgerSummary) -> float:
        """Calculate loan processing rate per hour"""
        # If we have sync history, calculate from that
        # Otherwise estimate from completed loans
        if self._last_sync_time:
            hours_since_last = (datetime.utcnow() - self._last_sync_time).total_seconds() / 3600
            if hours_since_last > 0 and summary.completed_loans > 0:
                return summary.completed_loans / max(hours_since_last, 1)
        
        # Default: assume 1 loan per 4 hours as baseline
        return summary.completed_loans / max(24, 1) if summary.completed_loans > 0 else 0.0
    
    def _calculate_agent_workload(
        self, 
        summary: VoltLedgerSummary, 
        bikes: List[VoltLedgerBike]
    ) -> float:
        """
        Calculate agent workload indicator (0-100)
        Based on pending/active loans vs available capacity
        """
        active_work = summary.active_loans + summary.pending_loans
        available_bikes = len([b for b in bikes if b.status == "available"])
        total_capacity = active_work + available_bikes
        
        if total_capacity == 0:
            return 0.0
        
        workload = (active_work / total_capacity) * 100
        return min(100.0, workload)
    
    async def sync(self) -> VoltLedgerMetrics:
        """
        Perform full sync with VoltLedger API
        Fetches all endpoints and calculates derived metrics
        """
        async with self._lock:
            self._metrics.connection_status = ConnectionStatus.CONNECTING
            
            # Fetch health first
            health = await self.get_health()
            
            if health:
                self._metrics.connection_status = ConnectionStatus.CONNECTED
                self._metrics.health = health
            else:
                self._metrics.connection_status = ConnectionStatus.ERROR
            
            # Fetch other data regardless of health status (may be partial)
            summary = await self.get_loans_summary()
            bikes = await self.get_bikes_status()
            recent_loans = await self.get_recent_loans(limit=50)
            
            if summary:
                self._metrics.summary = summary
                self._metrics.processing_rate = self._calculate_processing_rate(summary)
                self._metrics.agent_efficiency_score = self._calculate_efficiency_score(summary)
            
            if bikes:
                self._metrics.bikes = bikes
                self._metrics.bikes_available = len([b for b in bikes if b.status == "available"])
                self._metrics.bikes_assigned = len([b for b in bikes if b.status == "assigned"])
                self._metrics.bikes_maintenance = len([b for b in bikes if b.status == "maintenance"])
            
            if recent_loans:
                self._metrics.recent_loans = recent_loans
            
            # Calculate workload if we have both summary and bikes
            if summary and bikes:
                self._metrics.agent_workload_indicator = self._calculate_agent_workload(summary, bikes)
            
            # Update sync metadata
            self._last_sync_time = datetime.utcnow()
            self._sync_count += 1
            self._metrics.last_sync = self._last_sync_time
            
            # Notify callbacks
            self._notify_callbacks()
            
            return self._metrics
    
    async def start_polling(self):
        """Start background polling task"""
        if self._polling_task and not self._polling_task.done():
            return  # Already polling
        
        async def polling_loop():
            try:
                while True:
                    await self.sync()
                    await asyncio.sleep(self.config.polling_interval)
            except asyncio.CancelledError:
                pass
        
        self._polling_task = asyncio.create_task(polling_loop())
    
    async def stop_polling(self):
        """Stop background polling task"""
        if self._polling_task:
            self._polling_task.cancel()
            try:
                await self._polling_task
            except asyncio.CancelledError:
                pass
            self._polling_task = None
    
    @property
    def metrics(self) -> VoltLedgerMetrics:
        """Get current metrics (cached)"""
        return self._metrics
    
    @property
    def is_connected(self) -> bool:
        """Check if client is connected to VoltLedger"""
        return self._metrics.connection_status == ConnectionStatus.CONNECTED
    
    @property
    def last_sync(self) -> Optional[datetime]:
        """Get last sync timestamp"""
        return self._last_sync_time
    
    @property
    def sync_count(self) -> int:
        """Get total number of syncs performed"""
        return self._sync_count


# Singleton instance for global access
_default_client: Optional[VoltLedgerClient] = None


def get_voltledger_client(config: Optional[VoltLedgerConfig] = None) -> VoltLedgerClient:
    """Get or create default VoltLedger client instance"""
    global _default_client
    if _default_client is None:
        _default_client = VoltLedgerClient(config)
    return _default_client


async def initialize_voltledger_client(config: Optional[VoltLedgerConfig] = None) -> VoltLedgerClient:
    """Initialize and return VoltLedger client with default settings"""
    client = get_voltledger_client(config)
    await client.initialize()
    return client
