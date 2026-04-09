/**
 * SystemHealthPanel Component
 * Real-time system metrics with glass-morphism cards
 * Dark Vanta theme with cyan/magenta accents
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { HealthUpdateMessage } from '../../hooks/useWebSocket';

interface SystemHealthPanelProps {
  health: HealthUpdateMessage['payload'] | null;
}

// Metric card configuration
interface MetricConfig {
  key: keyof HealthUpdateMessage['payload'];
  label: string;
  unit: string;
  icon: string;
  color: string;
  glowColor: string;
  min?: number;
  max?: number;
  format?: (value: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'overallHealth',
    label: 'System Health',
    unit: '%',
    icon: '🏥',
    color: '#00f3ff',
    glowColor: 'rgba(0, 243, 255, 0.4)',
    min: 0,
    max: 100,
    format: (v) => v.toFixed(1)
  },
  {
    key: 'apiCallsPerMinute',
    label: 'API Calls/min',
    unit: '',
    icon: '📡',
    color: '#00ff88',
    glowColor: 'rgba(0, 255, 136, 0.4)',
    format: (v) => v.toFixed(0)
  },
  {
    key: 'errorRate',
    label: 'Error Rate',
    unit: '%',
    icon: '⚠️',
    color: '#ff4444',
    glowColor: 'rgba(255, 68, 68, 0.4)',
    min: 0,
    max: 100,
    format: (v) => (v * 100).toFixed(2)
  },
  {
    key: 'costEfficiency',
    label: 'Cost Efficiency',
    unit: '/10',
    icon: '💎',
    color: '#9d4edd',
    glowColor: 'rgba(157, 78, 221, 0.4)',
    min: 0,
    max: 10,
    format: (v) => v.toFixed(1)
  },
  {
    key: 'networkLatency',
    label: 'Latency',
    unit: 'ms',
    icon: '⏱️',
    color: '#ff8c00',
    glowColor: 'rgba(255, 140, 0, 0.4)',
    format: (v) => v.toFixed(0)
  },
  {
    key: 'databaseHealth',
    label: 'Database',
    unit: '%',
    icon: '💾',
    color: '#1890ff',
    glowColor: 'rgba(24, 144, 255, 0.4)',
    min: 0,
    max: 100,
    format: (v) => v.toFixed(0)
  }
];

// Agent status colors
const AGENT_STATUS_COLORS = {
  online: { color: '#00ff88', glow: 'rgba(0, 255, 136, 0.4)', bg: 'rgba(0, 255, 136, 0.1)' },
  busy: { color: '#00f3ff', glow: 'rgba(0, 243, 255, 0.4)', bg: 'rgba(0, 243, 255, 0.1)' },
  idle: { color: '#ff8c00', glow: 'rgba(255, 140, 0, 0.4)', bg: 'rgba(255, 140, 0, 0.1)' },
  offline: { color: '#ff4444', glow: 'rgba(255, 68, 68, 0.4)', bg: 'rgba(255, 68, 68, 0.1)' }
};

/**
 * Gauge Component
 */
const Gauge: React.FC<{
  value: number;
  min: number;
  max: number;
  color: string;
  size?: number;
}> = ({ value, min, max, color, size = 80 }) => {
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const circumference = 2 * Math.PI * ((size - 10) / 2);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 10) / 2}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={6}
        />
        {/* Value circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 10) / 2}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  metric: MetricConfig;
  value: number;
  index: number;
}> = ({ metric, value, index }) => {
  const formattedValue = metric.format ? metric.format(value) : value.toFixed(1);
  const percentage = metric.min !== undefined && metric.max !== undefined
    ? (value - metric.min) / (metric.max - metric.min)
    : 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      style={{
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: `1px solid ${metric.color}20`,
        boxShadow: `0 4px 30px ${metric.color}10`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 100,
        height: 100,
        background: `radial-gradient(circle, ${metric.glowColor}, transparent)`,
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '24px',
          filter: 'drop-shadow(0 0 10px ' + metric.color + ')'
        }}>
          {metric.icon}
        </div>
        {metric.min !== undefined && metric.max !== undefined && (
          <Gauge 
            value={value} 
            min={metric.min} 
            max={metric.max} 
            color={metric.color}
            size={60}
          />
        )}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '32px',
        fontWeight: 700,
        color: metric.color,
        fontFamily: 'monospace',
        textShadow: `0 0 20px ${metric.color}50`,
        marginBottom: '4px',
        lineHeight: 1
      }}>
        {formattedValue}
        <span style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginLeft: '4px'
        }}>
          {metric.unit}
        </span>
      </div>

      {/* Label */}
      <div style={{
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        {metric.label}
      </div>

      {/* Bar indicator */}
      {metric.min !== undefined && metric.max !== undefined && (
        <div style={{
          marginTop: '12px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage * 100}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${metric.color}, ${metric.color}80)`,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${metric.color}`
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

/**
 * Agent Status Distribution Component
 */
const AgentStatusDistribution: React.FC<{
  agentsOnline: number;
  agentsBusy: number;
  agentsIdle: number;
  agentsOffline: number;
}> = ({ agentsOnline, agentsBusy, agentsIdle, agentsOffline }) => {
  const total = agentsOnline + agentsBusy + agentsIdle + agentsOffline;
  
  const statuses = [
    { key: 'online', label: 'Online', count: agentsOnline, ...AGENT_STATUS_COLORS.online },
    { key: 'busy', label: 'Busy', count: agentsBusy, ...AGENT_STATUS_COLORS.busy },
    { key: 'idle', label: 'Idle', count: agentsIdle, ...AGENT_STATUS_COLORS.idle },
    { key: 'offline', label: 'Offline', count: agentsOffline, ...AGENT_STATUS_COLORS.offline }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        gridColumn: '1 / -1'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Agent Fleet Status
          </h4>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            {total} agents registered
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 255, 136, 0.3)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 10px #00ff88',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <span style={{
            fontSize: '12px',
            color: '#00ff88',
            fontWeight: 600
          }}>
            Live
          </span>
        </div>
      </div>

      {/* Status Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {statuses.map((status, index) => {
          const percentage = total > 0 ? (status.count / total) * 100 : 0;
          return (
            <motion.div
              key={status.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              style={{
                padding: '16px',
                background: status.bg,
                borderRadius: '12px',
                border: `1px solid ${status.color}30`,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Glow */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                background: `radial-gradient(circle, ${status.glow}, transparent)`,
                opacity: 0.3,
                pointerEvents: 'none'
              }} />

              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: status.color,
                fontFamily: 'monospace',
                textShadow: `0 0 20px ${status.color}50`,
                marginBottom: '4px'
              }}>
                {status.count}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                {status.label}
              </div>
              <div style={{
                height: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  style={{
                    height: '100%',
                    background: status.color,
                    borderRadius: '2px',
                    boxShadow: `0 0 8px ${status.color}`
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

/**
 * Connection Status Component
 */
const ConnectionStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      background: isConnected ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
      border: `1px solid ${isConnected ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`
    }}
  >
    <div style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: isConnected ? '#00ff88' : '#ff4444',
      boxShadow: isConnected ? '0 0 10px #00ff88' : '0 0 10px #ff4444',
      animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none'
    }} />
    <span style={{
      fontSize: '11px',
      color: isConnected ? '#00ff88' : '#ff4444',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  </motion.div>
);

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ health }) => {
  // Default values if health is null
  const defaultHealth: HealthUpdateMessage['payload'] = {
    overallHealth: 0,
    agentsOnline: 0,
    agentsBusy: 0,
    agentsIdle: 0,
    agentsOffline: 0,
    apiCallsPerMinute: 0,
    errorRate: 0,
    costEfficiency: 0,
    networkLatency: 0,
    databaseHealth: 0,
    timestamp: new Date().toISOString()
  };

  const data = health || defaultHealth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel-vanta"
      style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--glass-layer-2)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00f3ff, #9d4edd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            System Health
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            Real-time telemetry metrics
          </div>
        </div>
        <ConnectionStatus isConnected={!!health} />
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {METRICS.map((metric, index) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            value={data[metric.key] as number}
            index={index}
          />
        ))}
      </div>

      {/* Agent Status Distribution */}
      <AgentStatusDistribution
        agentsOnline={data.agentsOnline}
        agentsBusy={data.agentsBusy}
        agentsIdle={data.agentsIdle}
        agentsOffline={data.agentsOffline}
      />

      {/* Footer */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        <span>Data updates every 1 second</span>
        <span style={{ fontFamily: 'monospace' }}>
          Last update: {health ? new Date(data.timestamp).toLocaleTimeString() : 'Never'}
        </span>
      </div>
    </motion.div>
  );
};

export default SystemHealthPanel;
