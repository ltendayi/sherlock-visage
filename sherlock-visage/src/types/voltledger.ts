/**
 * VoltLedger TypeScript Types
 * Fintech micro-loan and e-bike fleet management types
 * Sherlock Visage Dashboard Integration
 */

// ============================================================================
// Core Loan Types
// ============================================================================

export type LoanStatus = 'active' | 'repaid' | 'defaulted' | 'pending' | 'suspended';
export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Loan {
  id: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  bikeId: string;
  principalAmount: number;
  interestRate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: LoanStatus;
  paymentFrequency: PaymentFrequency;
  installmentAmount: number;
  startDate: string;
  endDate: string;
  nextPaymentDate: string | null;
  daysOverdue: number;
  agentId: string;
  agentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPortfolio {
  totalLoans: number;
  activeLoans: number;
  repaidLoans: number;
  defaultedLoans: number;
  pendingLoans: number;
  totalPortfolioValue: number;
  totalOutstanding: number;
  defaultRate: number;
  averageLoanAmount: number;
  collectionRate: number;
}

// ============================================================================
// Bike Fleet Types
// ============================================================================

export type BikeStatus = 'available' | 'on-loan' | 'maintenance' | 'retired' | 'stolen';
export type BikeModel = 'basic' | 'standard' | 'premium' | 'cargo';

export interface Bike {
  id: string;
  bikeNumber: string;
  serialNumber: string;
  model: BikeModel;
  status: BikeStatus;
  currentLoanId: string | null;
  currentCustomerId: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  totalDistanceKm: number;
  gpsLocation: {
    lat: number;
    lng: number;
    lastUpdated: string;
  } | null;
  manufacturingDate: string;
  purchasePrice: number;
  depreciationValue: number;
  hubId: string;
  hubName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BikeFleet {
  totalBikes: number;
  availableBikes: number;
  onLoanBikes: number;
  maintenanceBikes: number;
  retiredBikes: number;
  stolenBikes: number;
  utilizationRate: number;
  fleetValue: number;
  byModel: Record<BikeModel, number>;
  byHub: Record<string, number>;
}

// ============================================================================
// M-Pesa Transaction Types
// ============================================================================

export type TransactionType = 'payment' | 'disbursement' | 'refund' | 'fee' | 'penalty';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'reversed';

export interface MpesasTransaction {
  id: string;
  transactionId: string;
  loanId: string | null;
  customerId: string;
  customerName: string;
  phoneNumber: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  mpesaReceiptNumber: string | null;
  description: string;
  agentId: string;
  agentName: string;
  processedAt: string;
  createdAt: string;
}

export interface TransactionVolume {
  dailyVolume: number;
  dailyCount: number;
  weeklyVolume: number;
  weeklyCount: number;
  monthlyVolume: number;
  monthlyCount: number;
  averageTransactionAmount: number;
  successRate: number;
  byType: Record<TransactionType, { count: number; volume: number }>;
}

// ============================================================================
// Revenue & Financial Types
// ============================================================================

export interface RevenueStream {
  timestamp: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  principalRepayments: number;
  interestIncome: number;
  feeIncome: number;
  penaltyIncome: number;
  totalRevenue: number;
  projectedRevenue: number;
}

export interface FinancialMetrics {
  grossRevenue: number;
  netRevenue: number;
  operationalCosts: number;
  profitMargin: number;
  roi: number;
}

// ============================================================================
// Sync Status Types
// ============================================================================

export type SyncStatus = 'connected' | 'disconnected' | 'syncing' | 'lagging' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: string;
  latencyMs: number;
  pendingOperations: number;
  errors: string[];
  voltledgerVersion: string;
  sherlockVersion: string;
}

export interface CrossSystemCorrelation {
  timestamp: string;
  agentTasksCompleted: number;
  loansProcessed: number;
  correlationCoefficient: number;
  efficiencyRatio: number;
}

// ============================================================================
// Operations Event Types
// ============================================================================

export type EventSystem = 'voltledger' | 'sherlock' | 'bridge';
export type EventType = 'loan_created' | 'payment_received' | 'bike_assigned' | 'task_completed' | 'sync_event' | 'alert';

export interface OperationsEvent {
  id: string;
  timestamp: string;
  system: EventSystem;
  type: EventType;
  agentId: string | null;
  agentName: string | null;
  entityId: string;
  entityType: 'loan' | 'bike' | 'transaction' | 'task';
  description: string;
  metadata: Record<string, any>;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export interface VoltLedgerUpdateMessage {
  type: 'voltledger_update';
  payload: {
    portfolio: LoanPortfolio | null;
    fleet: BikeFleet | null;
    transactions: TransactionVolume | null;
    revenue: RevenueStream[];
    sync: SyncState;
    events: OperationsEvent[];
    correlation: CrossSystemCorrelation[];
  };
  timestamp: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface VoltLedgerApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

// ============================================================================
// Dashboard View Types
// ============================================================================

export interface VoltLedgerDashboardData {
  portfolio: LoanPortfolio;
  fleet: BikeFleet;
  transactions: TransactionVolume;
  revenue: RevenueStream[];
  sync: SyncState;
  recentEvents: OperationsEvent[];
  correlation: CrossSystemCorrelation[];
}
