/**
 * WebSocket Client service for real-time updates
 * Standardized communication client for bidirectional data flow
 */

import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage, RealTimeCost, AgentDailyBudget } from '../types';

class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private listeners: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    // Mock WebSocket URL - in production, use actual backend URL
    const wsUrl = 'ws://localhost:8000'; // Default for development
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
      query: {
        clientType: 'dashboard',
        version: '1.0.0'
      }
    });

    this.setupEventListeners();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.notifyListeners('connect', {
        type: 'system',
        payload: 'WebSocket connected',
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log(`WebSocket disconnected: ${reason}`);
      this.notifyListeners('disconnect', {
        type: 'system',
        payload: `Disconnected: ${reason}`,
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
      this.notifyListeners('error', {
        type: 'system',
        payload: `Connection error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('reconnect', (attempt: number) => {
      console.log(`WebSocket reconnected after ${attempt} attempts`);
      this.notifyListeners('reconnect', {
        type: 'system',
        payload: `Reconnected after ${attempt} attempts`,
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`WebSocket reconnect attempt ${attempt}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.notifyListeners('reconnect_failed', {
        type: 'system',
        payload: 'Reconnection failed',
        timestamp: new Date().toISOString()
      });
    });

    // Message handlers
    this.socket.on('delegate_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'delegate_update',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('cost_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'cost_update',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('token_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'token_update',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('health_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'health_update',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('task_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'task_update',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('alert', (data: any) => {
      const message: WebSocketMessage = {
        type: 'alert',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('real_time_cost', (data: any) => {
      const message: WebSocketMessage = {
        type: 'real_time_cost',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    this.socket.on('agent_budget_update', (data: any) => {
      const message: WebSocketMessage = {
        type: 'agent_budget_update',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });

    // Custom event for system messages
    this.socket.on('system_message', (data: any) => {
      const message: WebSocketMessage = {
        type: 'system',
        payload: data,
        timestamp: new Date().toISOString()
      };
      this.handleMessage(message);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('Received WebSocket message:', message.type, message.payload);
    
    // Notify all listeners for this message type
    this.notifyListeners(message.type, message);
    
    // Also notify general message listeners
    this.notifyListeners('message', message);
  }

  /**
   * Send a message through WebSocket
   */
  public sendMessage(type: WebSocketMessage['type'], payload: any): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, message not sent:', type);
      return;
    }

    this.socket.emit(type, payload);
    console.log('Sent WebSocket message:', type, payload);
  }

  /**
   * Subscribe to WebSocket messages
   */
  public onMessage(callback: (message: WebSocketMessage) => void, messageType?: string): () => void {
    const type = messageType || 'message';
    
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    const listeners = this.listeners.get(type)!;
    listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners for a specific message type
   */
  private notifyListeners(type: string, message: WebSocketMessage): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('reconnect_failed', {
        type: 'system',
        payload: 'Max reconnection attempts reached',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting reconnection in ${delay}ms`);

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    reconnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.socket?.connected || false,
      reconnecting: this.socket?.active || false,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Subscribe to specific message types
   */
  public subscribeToDelegateUpdates(callback: (data: any) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'delegate_update') {
        callback(message.payload);
      }
    });
  }

  public subscribeToCostUpdates(callback: (data: any) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'cost_update') {
        callback(message.payload);
      }
    });
  }

  public subscribeToTokenUpdates(callback: (data: any) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'token_update') {
        callback(message.payload);
      }
    });
  }

  public subscribeToHealthUpdates(callback: (data: any) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'health_update') {
        callback(message.payload);
      }
    });
  }

  public subscribeToTaskUpdates(callback: (data: any) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'task_update') {
        callback(message.payload);
      }
    });
  }

  public subscribeToAlerts(callback: (data: any) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'alert') {
        callback(message.payload);
      }
    });
  }

  public subscribeToRealTimeCost(callback: (data: RealTimeCost) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'real_time_cost') {
        callback(message.payload as RealTimeCost);
      }
    });
  }

  public subscribeToAgentBudgetUpdates(callback: (data: AgentDailyBudget) => void): () => void {
    return this.onMessage((message) => {
      if (message.type === 'agent_budget_update') {
        callback(message.payload as AgentDailyBudget);
      }
    });
  }
}

export default WebSocketClient;