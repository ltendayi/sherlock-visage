/**
 * Real-time WebSocket Hook for Sherlock Visage Dashboard
 * Connects to ws://localhost:8001/ws/agents with auto-reconnect
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VoltLedgerUpdateMessage } from '../types/voltledger';

// WebSocket Message Types
export type WebSocketMessageType = 
  | 'delegate_update' 
  | 'cost_update' 
  | 'task_update' 
  | 'health_update' 
  | 'telemetry_update'
  | 'voltledger_update'
  | 'system';

// Delegate Update Message
export interface DelegateUpdateMessage {
  type: 'delegate_update';
  payload: {
    agentId: string;
    agentName: string;
    status: 'online' | 'busy' | 'idle' | 'offline' | 'error';
    cpuUsage: number;
    memoryUsage: number;
    tokenUsage: number;
    timestamp: string;
  };
  timestamp: string;
}

// Cost Update Message
export interface CostUpdateMessage {
  type: 'cost_update';
  payload: {
    agentId: string;
    agentName: string;
    currentCost: number;
    cumulativeCost: number;
    tokensUsed: number;
    modelName: string;
    timestamp: string;
  };
  timestamp: string;
}

// Task Update Message
export interface TaskUpdateMessage {
  type: 'task_update';
  payload: {
    taskId: string;
    title: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    agentId: string;
    agentName: string;
    progress: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
  };
  timestamp: string;
}

// Health Update Message
export interface HealthUpdateMessage {
  type: 'health_update';
  payload: {
    overallHealth: number;
    agentsOnline: number;
    agentsBusy: number;
    agentsIdle: number;
    agentsOffline: number;
    apiCallsPerMinute: number;
    errorRate: number;
    costEfficiency: number;
    networkLatency: number;
    databaseHealth: number;
    timestamp: string;
  };
  timestamp: string;
}

// Telemetry Update (aggregated)
export interface TelemetryUpdateMessage {
  type: 'telemetry_update';
  payload: {
    agents: DelegateUpdateMessage['payload'][];
    costs: CostUpdateMessage['payload'][];
    tasks: TaskUpdateMessage['payload'][];
    health: HealthUpdateMessage['payload'];
  };
  timestamp: string;
}

// System Message
export interface SystemMessage {
  type: 'system';
  payload: {
    message: string;
    level: 'info' | 'warning' | 'error';
  };
  timestamp: string;
}

export type WebSocketMessage = 
  | DelegateUpdateMessage 
  | CostUpdateMessage 
  | TaskUpdateMessage 
  | HealthUpdateMessage 
  | TelemetryUpdateMessage
  | VoltLedgerUpdateMessage
  | SystemMessage;

// Hook Return Type
export interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastMessage: WebSocketMessage | null;
  delegates: DelegateUpdateMessage['payload'][];
  costs: CostUpdateMessage['payload'][];
  tasks: TaskUpdateMessage['payload'][];
  health: HealthUpdateMessage['payload'] | null;
  voltledger: VoltLedgerUpdateMessage['payload'] | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (type: WebSocketMessageType, payload: any) => void;
}

// Constants - Uses relative path for Nginx proxy compatibility
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/agents`;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

/**
 * Custom hook for WebSocket connection with auto-reconnect
 */
export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Data states
  const [delegates, setDelegates] = useState<DelegateUpdateMessage['payload'][]>([]);
  const [costs, setCosts] = useState<CostUpdateMessage['payload'][]>([]);
  const [tasks, setTasks] = useState<TaskUpdateMessage['payload'][]>([]);
  const [health, setHealth] = useState<HealthUpdateMessage['payload'] | null>(null);
  const [voltledger, setVoltledger] = useState<VoltLedgerUpdateMessage['payload'] | null>(null);

  // Refs for WebSocket and timers
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(() => {
    const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    return Math.min(delay, MAX_RECONNECT_DELAY);
  }, []);

  /**
   * Parse incoming WebSocket message
   */
  const parseMessage = useCallback((data: string): WebSocketMessage | null => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type && parsed.payload) {
        return parsed as WebSocketMessage;
      }
      console.warn('Received malformed message:', parsed);
      return null;
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      return null;
    }
  }, []);

  /**
   * Update state based on message type
   */
  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage(message);

    switch (message.type) {
      case 'delegate_update':
        setDelegates(prev => {
          const existing = prev.find(d => d.agentId === message.payload.agentId);
          if (existing) {
            return prev.map(d => 
              d.agentId === message.payload.agentId ? message.payload : d
            );
          }
          return [...prev, message.payload];
        });
        break;

      case 'cost_update':
        setCosts(prev => {
          const filtered = prev.filter(c => c.agentId !== message.payload.agentId);
          return [...filtered, message.payload].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
        break;

      case 'task_update':
        setTasks(prev => {
          const existing = prev.find(t => t.taskId === message.payload.taskId);
          if (existing) {
            return prev.map(t =>
              t.taskId === message.payload.taskId ? message.payload : t
            );
          }
          return [...prev, message.payload];
        });
        break;

      case 'health_update':
        setHealth(message.payload);
        break;

      case 'telemetry_update':
        if (message.payload.agents) setDelegates(message.payload.agents);
        if (message.payload.costs) setCosts(message.payload.costs);
        if (message.payload.tasks) setTasks(message.payload.tasks);
        if (message.payload.health) setHealth(message.payload.health);
        break;

      case 'voltledger_update':
        setVoltledger(message.payload);
        break;

      case 'system':
        console.log(`[WebSocket System ${message.payload.level}]:`, message.payload.message);
        break;
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log(`Attempting to connect to ${WS_URL}...`);
      setIsReconnecting(true);

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
        
        // Request initial data sync
        ws.send(JSON.stringify({
          type: 'system',
          payload: { action: 'sync_request' },
          timestamp: new Date().toISOString()
        }));
      };

      ws.onmessage = (event) => {
        const message = parseMessage(event.data);
        if (message) {
          handleMessage(message);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnect if not manually disconnected
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectAttemptsRef.current += 1;
          setReconnectAttempts(reconnectAttemptsRef.current);
          setIsReconnecting(true);

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setIsReconnecting(false);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
      setIsReconnecting(false);
    }
  }, [getReconnectDelay, handleMessage, parseMessage]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Reset reconnect attempts to prevent auto-reconnect
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsReconnecting(false);
    console.log('WebSocket manually disconnected');
  }, []);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((type: WebSocketMessageType, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString()
      } as WebSocketMessage;
      
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    lastMessage,
    delegates,
    costs,
    tasks,
    health,
    voltledger,
    connect,
    disconnect,
    sendMessage
  };
};

export default useWebSocket;
