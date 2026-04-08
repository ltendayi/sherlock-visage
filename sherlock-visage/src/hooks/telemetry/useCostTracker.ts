import { useState, useEffect, useCallback } from 'react';

export interface AgentCost {
  agentId: string;
  name: string;
  avatar: string;
  clearance: string;
  currentSessionCost: number;
  dailyBudget: number;
  usagePercentage: number;
  costPerSecond: number;
  lastActivity: Date;
  tokenRate: number;
  model: string;
  status: 'idle' | 'working' | 'error';
}

const MODEL_PRICING: Record<string, number> = {
  'gpt-4o': 0.005,
  'gpt-4.1-mini': 0.0004,
  'deepseek-v3.2': 0.00015,
  'deepseek-r1': 0.00055,
  'gpt-5-nano': 0.0001,
};

// 7 registered agents from VoltLedger
const INITIAL_AGENTS: AgentCost[] = [
  {
    agentId: 'volt_backend',
    name: 'volt_backend',
    avatar: '🔧',
    clearance: 'backend',
    currentSessionCost: 0,
    dailyBudget: 5,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 80,
    model: 'deepseek-v3.2',
    status: 'idle'
  },
  {
    agentId: 'volt_fintech',
    name: 'volt_fintech',
    avatar: '💰',
    clearance: 'fintech',
    currentSessionCost: 0,
    dailyBudget: 8,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 120,
    model: 'gpt-4.1-mini',
    status: 'idle'
  },
  {
    agentId: 'volt_frontend',
    name: 'volt_frontend',
    avatar: '🎨',
    clearance: 'frontend',
    currentSessionCost: 0,
    dailyBudget: 4,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 60,
    model: 'deepseek-r1',
    status: 'idle'
  },
  {
    agentId: 'volt_devops',
    name: 'volt_devops',
    avatar: '🚀',
    clearance: 'infrastructure',
    currentSessionCost: 0,
    dailyBudget: 3,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 40,
    model: 'gpt-4.1-mini',
    status: 'idle'
  },
  {
    agentId: 'volt_data_arch',
    name: 'volt_data_arch',
    avatar: '🗄️',
    clearance: 'database',
    currentSessionCost: 0,
    dailyBudget: 4,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 50,
    model: 'deepseek-v3.2',
    status: 'idle'
  },
  {
    agentId: 'volt_automation',
    name: 'volt_automation',
    avatar: '⚡',
    clearance: 'automation',
    currentSessionCost: 0,
    dailyBudget: 2,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 30,
    model: 'gpt-4.1-mini',
    status: 'idle'
  },
  {
    agentId: 'volt_bi',
    name: 'volt_bi',
    avatar: '📊',
    clearance: 'analytics',
    currentSessionCost: 0,
    dailyBudget: 3,
    usagePercentage: 0,
    costPerSecond: 0,
    lastActivity: new Date(),
    tokenRate: 45,
    model: 'deepseek-v3.2',
    status: 'idle'
  },
];

export const useCostTracker = () => {
  const [agents, setAgents] = useState<AgentCost[]>(INITIAL_AGENTS);
  const [sessionStart] = useState<Date>(new Date());

  // Simulate real-time cost accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        // 40% chance of activity per agent per tick
        if (Math.random() > 0.6) {
          const modelPrice = MODEL_PRICING[agent.model] || 0.0001;
          const tokensThisTick = Math.floor(Math.random() * agent.tokenRate / 4);
          const costIncrease = (tokensThisTick * modelPrice) / 1000;
          const newCost = agent.currentSessionCost + costIncrease;
          
          return {
            ...agent,
            currentSessionCost: newCost,
            usagePercentage: Math.min((newCost / agent.dailyBudget) * 100, 100),
            costPerSecond: costIncrease * 4, // smoothed
            lastActivity: new Date(),
            status: Math.random() > 0.1 ? 'working' : 'idle'
          };
        }
        // Gradually reduce costPerSecond when idle
        return {
          ...agent,
          costPerSecond: agent.costPerSecond * 0.8,
          status: agent.costPerSecond < 0.0001 ? 'idle' : agent.status
        };
      }));
    }, 250); // Update 4x per second for smooth animation

    return () => clearInterval(interval);
  }, []);

  const totalFleetCost = agents.reduce((sum, agent) => sum + agent.currentSessionCost, 0);
  const activeAgents = agents.filter(a => a.status === 'working').length;
  const totalBudget = agents.reduce((sum, a) => sum + a.dailyBudget, 0);
  const fleetEfficiency = (totalFleetCost / totalBudget) * 100;

  return {
    agents,
    totalFleetCost,
    activeAgents,
    totalBudget,
    fleetEfficiency,
    sessionStart
  };
};
