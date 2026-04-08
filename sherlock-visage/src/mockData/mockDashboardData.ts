/**
 * Mock data for Sherlock Visage Dashboard
 * Updated to match TypeScript interfaces exactly
 */

import type {
  DelegateNode,
  CostMetrics,
  TokenEfficiency,
  SystemHealth,
  Task,
  NairobiFloorPlan,
  DashboardMetrics
} from '../types';

// Mock delegate nodes - matches DelegateNode interface
export const delegates: DelegateNode[] = [
  {
    id: 'strategic_architect',
    name: 'Strategic Architect',
    type: 'archivist',
    status: 'active',
    cpuUsage: 45.2,
    memoryUsage: 67.8,
    tokenUsage: 1250,
    lastActive: '2026-04-07T10:30:00Z',
    coordinates: { x: 150, y: 100 },
    color: '#4CAF50',
    glowIntensity: 0.8
  },
  {
    id: 'lead_developer',
    name: 'Lead Developer',
    type: 'executor',
    status: 'active',
    cpuUsage: 78.5,
    memoryUsage: 82.3,
    tokenUsage: 890,
    lastActive: '2026-04-07T10:25:00Z',
    coordinates: { x: 350, y: 200 },
    color: '#2196F3',
    glowIntensity: 0.9
  },
  {
    id: 'security_auditor',
    name: 'Security Auditor',
    type: 'validator',
    status: 'idle',
    cpuUsage: 12.3,
    memoryUsage: 34.5,
    tokenUsage: 210,
    lastActive: '2026-04-07T09:45:00Z',
    coordinates: { x: 550, y: 100 },
    color: '#FF9800',
    glowIntensity: 0.3
  },
  {
    id: 'rapid_prototyper',
    name: 'Rapid Prototyper',
    type: 'executor',
    status: 'active',
    cpuUsage: 65.7,
    memoryUsage: 71.2,
    tokenUsage: 540,
    lastActive: '2026-04-07T10:15:00Z',
    coordinates: { x: 200, y: 300 },
    color: '#9C27B0',
    glowIntensity: 0.7
  },
  {
    id: 'algorithm_specialist',
    name: 'Algorithm Specialist',
    type: 'analyst',
    status: 'error',
    cpuUsage: 95.8,
    memoryUsage: 88.9,
    tokenUsage: 1250,
    lastActive: '2026-04-07T09:30:00Z',
    coordinates: { x: 500, y: 300 },
    color: '#F44336',
    glowIntensity: 1.0
  },
  {
    id: 'crisis_resolver',
    name: 'Crisis Resolver',
    type: 'monitor',
    status: 'idle',
    cpuUsage: 5.2,
    memoryUsage: 18.7,
    tokenUsage: 75,
    lastActive: '2026-04-06T16:20:00Z',
    coordinates: { x: 350, y: 400 },
    color: '#607D8B',
    glowIntensity: 0.1
  },
  {
    id: 'documentation_specialist',
    name: 'Documentation Specialist',
    type: 'archivist',
    status: 'active',
    cpuUsage: 32.4,
    memoryUsage: 45.6,
    tokenUsage: 320,
    lastActive: '2026-04-07T10:10:00Z',
    coordinates: { x: 650, y: 400 },
    color: '#795548',
    glowIntensity: 0.6
  }
];

// Mock cost metrics - matches CostMetrics interface
export const costMetrics: CostMetrics = {
  monthlyBudget: 425,
  currentSpend: 127,
  projectedSpend: 280,
  dailyAverage: 4.2,
  costPerToken: 0.003,
  budgetRange: { min: 280, max: 570 }
};

// Mock token efficiency data - matches TokenEfficiency interface
export const tokenData: TokenEfficiency[] = [
  { timestamp: '2026-04-01T00:00:00Z', deltaTokens: 1200, fullFileTokens: 4800, efficiencyRatio: 75.0, taskType: 'code-review' },
  { timestamp: '2026-04-02T00:00:00Z', deltaTokens: 1500, fullFileTokens: 5200, efficiencyRatio: 71.2, taskType: 'development' },
  { timestamp: '2026-04-03T00:00:00Z', deltaTokens: 1800, fullFileTokens: 6100, efficiencyRatio: 70.5, taskType: 'testing' },
  { timestamp: '2026-04-04T00:00:00Z', deltaTokens: 1400, fullFileTokens: 4900, efficiencyRatio: 71.4, taskType: 'debugging' },
  { timestamp: '2026-04-05T00:00:00Z', deltaTokens: 2100, fullFileTokens: 6800, efficiencyRatio: 69.1, taskType: 'deployment' },
  { timestamp: '2026-04-06T00:00:00Z', deltaTokens: 1900, fullFileTokens: 5900, efficiencyRatio: 67.8, taskType: 'monitoring' },
  { timestamp: '2026-04-07T00:00:00Z', deltaTokens: 2200, fullFileTokens: 7100, efficiencyRatio: 69.0, taskType: 'optimization' }
];

// Mock system health - matches SystemHealth interface
export const systemHealth: SystemHealth = {
  overall: 80.0,
  networkLatency: 45,
  apiAvailability: 92,
  databaseHealth: 85,
  queueDepth: 12,
  lastUpdated: '2026-04-07T10:45:00Z'
};

// Mock tasks - matches Task interface
export const tasks: Task[] = [
  {
    id: 'task_001',
    title: 'Implement Delta-Only Delegation',
    description: 'Send git diffs instead of full files',
    status: 'done',
    priority: 'high',
    assignee: 'lead_developer',
    dueDate: '2026-04-06',
    tokenCost: 1200,
    tags: ['optimization', 'efficiency']
  },
  {
    id: 'task_002',
    title: 'Setup Efficiency Guards',
    description: 'Context compression and cost routing',
    status: 'in-progress',
    priority: 'critical',
    assignee: 'strategic_architect',
    dueDate: '2026-04-07',
    tokenCost: 850,
    tags: ['security', 'performance']
  },
  {
    id: 'task_003',
    title: 'Create Nairobi Visualization',
    description: 'Interactive floorplan with 7 delegate nodes',
    status: 'done',
    priority: 'medium',
    assignee: 'rapid_prototyper',
    dueDate: '2026-04-06',
    tokenCost: 670,
    tags: ['visualization', 'ui']
  },
  {
    id: 'task_004',
    title: 'Fix File Descriptor Limits',
    description: 'Increase from 1024 to 65536 file descriptors',
    status: 'done',
    priority: 'critical',
    assignee: 'crisis_resolver',
    dueDate: '2026-04-07',
    tokenCost: 320,
    tags: ['infrastructure', 'performance']
  },
  {
    id: 'task_005',
    title: 'Secure Nginx Configuration',
    description: 'Basic auth and rate limiting for public access',
    status: 'in-progress',
    priority: 'high',
    assignee: 'security_auditor',
    dueDate: '2026-04-07',
    tokenCost: 540,
    tags: ['security', 'devops']
  },
  {
    id: 'task_006',
    title: 'Clean Architecture Templates',
    description: 'ASP.NET Core + React templates',
    status: 'todo',
    priority: 'medium',
    assignee: 'documentation_specialist',
    dueDate: '2026-04-08',
    tokenCost: 410,
    tags: ['documentation', 'templates']
  }
];

// Mock Nairobi floorplan - matches NairobiFloorPlan interface
export const floorPlan: NairobiFloorPlan = {
  width: 800,
  height: 600,
  zones: [
    { name: 'Strategy Hub', coordinates: { x1: 100, y1: 50, x2: 200, y2: 150 }, color: '#4CAF50', opacity: 0.3 },
    { name: 'Development Core', coordinates: { x1: 300, y1: 150, x2: 400, y2: 250 }, color: '#2196F3', opacity: 0.4 },
    { name: 'Security Vault', coordinates: { x1: 500, y1: 50, x2: 600, y2: 150 }, color: '#FF9800', opacity: 0.3 },
    { name: 'Prototype Lab', coordinates: { x1: 150, y1: 250, x2: 250, y2: 350 }, color: '#9C27B0', opacity: 0.4 },
    { name: 'Algorithm Engine', coordinates: { x1: 450, y1: 250, x2: 550, y2: 350 }, color: '#F44336', opacity: 0.3 },
    { name: 'Crisis Center', coordinates: { x1: 300, y1: 350, x2: 400, y2: 450 }, color: '#607D8B', opacity: 0.4 },
    { name: 'Documentation Archive', coordinates: { x1: 600, y1: 350, x2: 700, y2: 450 }, color: '#795548', opacity: 0.3 }
  ],
  delegateNodes: delegates
};

// Mock dashboard metrics - matches DashboardMetrics interface
export const metrics: DashboardMetrics = {
  activeDelegates: 4,
  totalTasksCompleted: 12,
  tokenSavings: 14250,
  uptimePercentage: 99.8,
  responseTimeAvg: 2.3
};