/**
 * Simple data hook for Sherlock Visage Dashboard
 * Provides mock data for dashboard components
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  DelegateNode,
  CostMetrics,
  TokenEfficiency,
  SystemHealth,
  Task,
  NairobiFloorPlan,
  DashboardMetrics
} from '../types';

// Import mock data
import {
  delegates as mockDelegates,
  costMetrics as mockCostMetrics,
  tokenData as mockTokenData,
  systemHealth as mockSystemHealth,
  tasks as mockTasks,
  floorPlan as mockFloorPlan,
  metrics as mockMetrics
} from '../mockData/mockDashboardData';

interface UseDashboardDataReturn {
  delegates: DelegateNode[];
  costMetrics: CostMetrics;
  tokenData: TokenEfficiency[];
  systemHealth: SystemHealth;
  tasks: Task[];
  floorPlan: NairobiFloorPlan;
  metrics: DashboardMetrics;
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  setDelegates: (delegates: DelegateNode[]) => void;
  setTasks: (tasks: Task[]) => void;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [delegates, setDelegates] = useState<DelegateNode[]>(mockDelegates);
  const [costMetrics] = useState<CostMetrics>(mockCostMetrics);
  const [tokenData] = useState<TokenEfficiency[]>(mockTokenData);
  const [systemHealth] = useState<SystemHealth>(mockSystemHealth);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [floorPlan] = useState<NairobiFloorPlan>(mockFloorPlan);
  const [metrics] = useState<DashboardMetrics>(mockMetrics);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, this would fetch from API
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, fetch from /api/v1/delegates, etc.
      console.log('Refreshing dashboard data...');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    delegates,
    costMetrics,
    tokenData,
    systemHealth,
    tasks,
    floorPlan,
    metrics,
    isLoading,
    error,
    refreshData,
    setDelegates,
    setTasks
  };
};