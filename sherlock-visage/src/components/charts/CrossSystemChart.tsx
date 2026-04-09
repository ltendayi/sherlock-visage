/**
 * CrossSystemChart Component
 * Correlation visualization: Agent Activity vs VoltLedger Operations
 * Dual Y-axis with time-synchronized data display
 * Dark Vanta theme with cyan/magenta accents
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import type { CrossSystemCorrelation, SyncState } from '../../types/voltledger';

interface CrossSystemChartProps {
  data: CrossSystemCorrelation[];
  sync: SyncState | null;
}

// Time range options
export type TimeRange = '15m' | '1h' | '6h' | '24h';

const TIME_RANGE_CONFIG: Record<TimeRange, { label: string; points: number }> = {
  '15m': { label: '15 Minutes', points: 15 },
  '1h': { label: '1 Hour', points: 60 },
  '6h': { label: '6 Hours', points: 72 },
  '24h': { label: '24 Hours', points: 96 }
};

// Sync status configuration
const SYNC_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  pulse: boolean;
}> = {
  connected: {
    label: 'Connected',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    icon: '✓',
    pulse: true
  },
  disconnected: {
    label: 'Disconnected',
    color: '#ff4444',
    bgColor: 'rgba(255, 68, 68, 0.1)',
    icon: '✕',
    pulse: false
  },
  syncing: {
    label: 'Syncing',
    color: '#00f3ff',
    bgColor: 'rgba(0, 243, 255, 0.1)',
    icon: '🔄',
    pulse: true
  },
  lagging: {
    label: 'Lag Detected',
    color: '#ff8c00',
    bgColor: 'rgba(255, 140, 0, 0.1)',
    icon: '⚠️',
    pulse: true
  },
  error: {
    label: 'Error',
    color: '#ff006e',
    bgColor: 'rgba(255, 0, 110, 0.1)',
    icon: '⚠️',
    pulse: false
  }
};

/**
 * Custom Tooltip with Vanta styling
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  label?: string;
  payload?: any[];
}> = ({ active, label, payload }) => {
  if (active && payload && payload.length) {
    const agentData = payload.find(p => p.dataKey === 'agentTasks');
    const loanData = payload.find(p => p.dataKey === 'loansProcessed');
    const efficiency = payload.find(p => p.dataKey === 'efficiencyRatio');

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          padding: '16px',
          border: '1px solid rgba(0, 243, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(0, 243, 255, 0.2), 0 20px 80px rgba(0, 0, 0, 0.8)',
          minWidth: '220px'
        }}
      >
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '8px'
        }}>
          {label}
        </div>

        {/* Agent Tasks */}
        {agentData && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ff006e',
                boxShadow: '0 0 10px #ff006e'
              }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                Agent Tasks
              </span>
            </div>
            <span style={{
              color: '#ff006e',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {agentData.value}
            </span>
          </div>
        )}

        {/* Loans Processed */}
        {loanData && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#00f3ff',
                boxShadow: '0 0 10px #00f3ff'
              }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                Loans Processed
              </span>
            </div>
            <span style={{
              color: '#00f3ff',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {loanData.value}
            </span>
          </div>
        )}

        {/* Efficiency */}
        {efficiency && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '8px'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
              Efficiency Ratio
            </span>
            <span style={{
              color: '#9d4edd',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {efficiency.value?.toFixed(2)}x
            </span>
          </div>
        )}
      </motion.div>
    );
  }
  return null;
};

/**
 * Sync Status Indicator
 */
const SyncStatusIndicator: React.FC<{ sync: SyncState | null }> = ({ sync }) => {
  const status = sync?.status || 'disconnected';
  const config = SYNC_CONFIG[status] || SYNC_CONFIG.disconnected;
  const latency = sync?.latencyMs || 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '10px',
          background: config.bgColor,
          border: `1px solid ${config.color}50`,
          boxShadow: config.pulse ? `0 0 15px ${config.color}30` : 'none'
        }}
      >
        <motion.div
          animate={config.pulse ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: config.color,
            boxShadow: `0 0 10px ${config.color}`
          }}
        />
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: config.color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {config.label}
        </span>
      </motion.div>

      {/* Latency */}
      {sync && status !== 'disconnected' && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '11px',
          color: latency < 100 ? '#00ff88' : latency < 500 ? '#ff8c00' : '#ff4444',
          fontFamily: 'monospace'
        }}>
          {latency}ms
        </div>
      )}

      {/* Pending Operations */}
      {sync && sync.pendingOperations > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 140, 0, 0.1)',
            border: '1px solid rgba(255, 140, 0, 0.3)',
            fontSize: '11px',
            color: '#ff8c00'
          }}
        >
          {sync.pendingOperations} pending
        </motion.div>
      )}
    </div>
  );
};

/**
 * Time Range Selector
 */
const TimeRangeSelector: React.FC<{
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}> = ({ value, onChange }) => (
  <div style={{
    display: 'flex',
    gap: '8px'
  }}>
    {(Object.keys(TIME_RANGE_CONFIG) as TimeRange[]).map(range => (
      <motion.button
        key={range}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(range)}
        style={{
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: value === range ? '#00f3ff' : 'rgba(255, 255, 255, 0.1)',
          background: value === range
            ? 'linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(157, 78, 221, 0.2))'
            : 'rgba(255, 255, 255, 0.03)',
          color: value === range ? '#00f3ff' : 'rgba(255, 255, 255, 0.6)',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: value === range ? '0 0 20px rgba(0, 243, 255, 0.3)' : 'none'
        }}
      >
        {TIME_RANGE_CONFIG[range].label}
      </motion.button>
    ))}
  </div>
);

export const CrossSystemChart: React.FC<CrossSystemChartProps> = ({
  data,
  sync
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  /**
   * Transform correlation data for the chart
     */
  const chartData = useMemo(() => {
    const now = Date.now();
    const rangeMs = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    }[timeRange];

    const cutoffTime = now - rangeMs;

    // Filter and sort data
    const filteredData = data
      .filter(d => new Date(d.timestamp).getTime() > cutoffTime)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Transform to chart format
    return filteredData.map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      agentTasks: d.agentTasksCompleted,
      loansProcessed: d.loansProcessed,
      efficiencyRatio: d.efficiencyRatio,
      correlation: d.correlationCoefficient
    }));
  }, [data, timeRange]);

  /**
   * Calculate correlation statistics
   */
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const latest = data[data.length - 1];
    const avgCorrelation = data.reduce((sum, d) => sum + d.correlationCoefficient, 0) / data.length;
    const avgEfficiency = data.reduce((sum, d) => sum + d.efficiencyRatio, 0) / data.length;

    return {
      correlation: avgCorrelation,
      efficiency: avgEfficiency,
      totalTasks: latest.agentTasksCompleted,
      totalLoans: latest.loansProcessed
    };
  }, [data]);

  // Calculate averages for the mean lines
  const avgTasks = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.agentTasks, 0) / chartData.length;
  }, [chartData]);

  const avgLoans = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.loansProcessed, 0) / chartData.length;
  }, [chartData]);

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
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00f3ff, #ff006e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Cross-System Correlation
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            Agent Activity vs VoltLedger Operations
          </div>
        </div>
        <SyncStatusIndicator sync={sync} />
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <StatBox
            label="Correlation"
            value={`${stats.correlation.toFixed(2)}`}
            color="#9d4edd"
            icon="📊"
          />
          <StatBox
            label="Efficiency"
            value={`${stats.efficiency.toFixed(2)}x`}
            color="#00ff88"
            icon="⚡"
          />
          <StatBox
            label="Total Tasks"
            value={stats.totalTasks.toString()}
            color="#ff006e"
            icon="🔍"
          />
          <StatBox
            label="Loans Processed"
            value={stats.totalLoans.toString()}
            color="#00f3ff"
            icon="📄"
          />
        </div>
      )}

      {/* Time Range Selector */}
      <div style={{ marginBottom: '24px' }}>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 60, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="agentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff006e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff006e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            
            <XAxis
              dataKey="time"
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tickLine={false}
              tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            
            {/* Left Y-axis - Agent Tasks */}
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#ff006e', fontSize: 11 }}
              label={{
                value: 'Agent Tasks',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: { fill: '#ff006e', fontSize: 11 }
              }}
            />
            
            {/* Right Y-axis - Loans Processed */}
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#00f3ff', fontSize: 11 }}
              label={{
                value: 'Loans',
                angle: 90,
                position: 'insideRight',
                offset: 0,
                style: { fill: '#00f3ff', fontSize: 11 }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Average Lines */}
            {avgTasks > 0 && (
              <ReferenceLine
                yAxisId="left"
                y={avgTasks}
                stroke="#ff006e"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
            )}
            {avgLoans > 0 && (
              <ReferenceLine
                yAxisId="right"
                y={avgLoans}
                stroke="#00f3ff"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
            )}
            
            {/* Agent Tasks Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="agentTasks"
              name="Agent Tasks"
              stroke="#ff006e"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#ff006e',
                stroke: '#fff',
                strokeWidth: 2
              }}
              animationDuration={500}
            />
            
            {/* Loans Processed Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="loansProcessed"
              name="Loans Processed"
              stroke="#00f3ff"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#00f3ff',
                stroke: '#fff',
                strokeWidth: 2
              }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '3px',
            background: '#ff006e',
            borderRadius: '2px',
            boxShadow: '0 0 8px #ff006e'
          }} />
          <span style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Agent Tasks Completed
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '3px',
            background: '#00f3ff',
            borderRadius: '2px',
            boxShadow: '0 0 8px #00f3ff'
          }} />
          <span style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Loans Processed
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Stat Box Component
 */
const StatBox: React.FC<{
  label: string;
  value: string;
  color: string;
  icon: string;
}> = ({ label, value, color, icon }) => (
  <div style={{
    textAlign: 'center',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '10px',
    border: `1px solid ${color}20`
  }}>
    <div style={{
      fontSize: '16px',
      marginBottom: '4px'
    }}>
      {icon}
    </div>
    <div style={{
      fontSize: '20px',
      fontWeight: 700,
      color: color,
      fontFamily: 'monospace',
      textShadow: `0 0 10px ${color}50`
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '10px',
      color: 'rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginTop: '4px'
    }}>
      {label}
    </div>
  </div>
);

export default CrossSystemChart;
