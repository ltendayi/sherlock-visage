/**
 * TypeScript types for Sherlock Visage Dashboard API contracts
 * Standardized communication format for AI delegate operations
 */

export interface DelegateNode {
  id: string;
  name: string;
  type: 'analyst' | 'strategist' | 'coordinator' | 'monitor' | 'executor' | 'validator' | 'archivist';
  status: 'active' | 'idle' | 'busy' | 'error';
  cpuUsage: number;
  memoryUsage: number;
  tokenUsage: number;
  lastActive: string;
  coordinates: { x: number; y: number };
  color: string;
  glowIntensity: number;
}

export interface CostMetrics {
  monthlyBudget: number;
  currentSpend: number;
  projectedSpend: number;
  dailyAverage: number;
  costPerToken: number;
  budgetRange: { min: number; max: number };
}

export interface RealTimeCost {
  agentId: string;
  agentName: string;
  currentCost: number;
  tokensUsed: number;
  modelName: string;
  costPer1KTokens: number;
  timestamp: string;
  dailyBudgetUsed: number;
}

export interface ModelPricing {
  modelName: string;
  inputCostPer1KTokens: number;
  outputCostPer1KTokens: number;
  contextWindow: number;
}

export interface AgentDailyBudget {
  agentId: string;
  agentName: string;
  dailyBudget: number;
  usedToday: number;
  remaining: number;
  progress: number;
  lastUpdate: string;
}

export interface TokenEfficiency {
  timestamp: string;
  deltaTokens: number;
  fullFileTokens: number;
  efficiencyRatio: number;
  taskType: string;
}

export interface SystemHealth {
  overall: number;
  networkLatency: number;
  apiAvailability: number;
  databaseHealth: number;
  queueDepth: number;
  lastUpdated: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dueDate: string;
  tokenCost: number;
  tags: string[];
}

export interface WebSocketMessage {
  type: 'delegate_update' | 'cost_update' | 'token_update' | 'health_update' | 'task_update' | 'alert' | 'system' | 'real_time_cost' | 'agent_budget_update';
  payload: DelegateNode | CostMetrics | TokenEfficiency[] | SystemHealth | Task | RealTimeCost | AgentDailyBudget | string;
  timestamp: string;
}

export interface DashboardMetrics {
  activeDelegates: number;
  totalTasksCompleted: number;
  tokenSavings: number;
  uptimePercentage: number;
  responseTimeAvg: number;
}

export interface NairobiFloorPlan {
  width: number;
  height: number;
  zones: {
    name: string;
    coordinates: { x1: number; y1: number; x2: number; y2: number };
    color: string;
    opacity: number;
  }[];
  delegateNodes: DelegateNode[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}