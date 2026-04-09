/**
 * CostChart Component
 * Real-time line chart showing cost accumulation over time with multi-agent overlay
 * Dark theme with cyan/magenta accents matching Vanta theme
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { CostUpdateMessage } from '../../hooks/useWebSocket';

// Time range options
export type TimeRange = '1m' | '5m' | '15m' | '1h';

interface CostChartProps {
  data: CostUpdateMessage['payload'][];
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
}

// Agent color mapping for multi-agent overlay
const AGENT_COLORS: Record<string, string> = {
  'volt_backend': '#00f3ff',     // Electric cyan
  'volt_fintech': '#9d4edd',     // Security purple
  'volt_frontend': '#00ff88',    // Analyst green
  'volt_devops': '#ff8c00',      // Crisis orange
  'volt_data_arch': '#1890ff',   // Architect blue
  'volt_automation': '#ff006e',  // Magenta
  'volt_bi': '#fb5607',          // Orange-red
  'default': '#00f3ff'
};

// Time range configuration
const TIME_RANGE_CONFIG: Record<TimeRange, { label: string; points: number; interval: string }> = {
  '1m': { label: '1 Minute', points: 60, interval: '1s' },
  '5m': { label: '5 Minutes', points: 60, interval: '5s' },
  '15m': { label: '15 Minutes', points: 90, interval: '10s' },
  '1h': { label: '1 Hour', points: 120, interval: '30s' }
};

/**
 * Format cost value for display
 */
const formatCost = (value: number): string => {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
};

/**
 * Custom tooltip with Vanta styling
 */
const CustomTooltip: React.FC<{
  active?: boolean;
  label?: string;
  payload?: any[];
}> = ({ active, label, payload }) => {
  if (active && payload && payload.length) {
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
          minWidth: '200px'
        }}
      >
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '8px'
        }}>
          {label}
        </div>
        {payload.map((entry, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  boxShadow: `0 0 10px ${entry.color}`
                }}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px' }}>
                {entry.name}
              </span>
            </div>
            <span style={{
              color: entry.color,
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {formatCost(entry.value)}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

/**
 * Time range selector button
 */
const TimeButton: React.FC<{
  range: TimeRange;
  isActive: boolean;
  onClick: () => void;
}> = ({ range, isActive, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid',
      borderColor: isActive ? '#00f3ff' : 'rgba(255, 255, 255, 0.1)',
      background: isActive 
        ? 'linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(157, 78, 221, 0.2))'
        : 'rgba(255, 255, 255, 0.03)',
      color: isActive ? '#00f3ff' : 'rgba(255, 255, 255, 0.6)',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: isActive ? '0 0 20px rgba(0, 243, 255, 0.3)' : 'none'
    }}
  >
    {TIME_RANGE_CONFIG[range].label}
  </motion.button>
);

export const CostChart: React.FC<CostChartProps> = ({
  data,
  timeRange = '5m',
  onTimeRangeChange
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  /**
   * Transform cost data for the chart
   * Group by timestamp and agent
   */
  const chartData = useMemo(() => {
    const now = Date.now();
    const rangeMs = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000
    }[timeRange];

    const cutoffTime = now - rangeMs;
    
    // Filter data to time range
    const filteredData = data.filter(d => 
      new Date(d.timestamp).getTime() > cutoffTime
    );

    // Group by time buckets
    const timeBuckets = new Map<string, Map<string, number>>();
    
    filteredData.forEach(cost => {
      const time = new Date(cost.timestamp);
      // Round to nearest 10 seconds for grouping
      time.setSeconds(Math.floor(time.getSeconds() / 10) * 10, 0);
      const timeKey = time.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });

      if (!timeBuckets.has(timeKey)) {
        timeBuckets.set(timeKey, new Map());
      }
      
      const bucket = timeBuckets.get(timeKey)!;
      // Keep the latest value or accumulate
      bucket.set(cost.agentId, cost.cumulativeCost);
    });

    // Convert to chart data format
    const sortedTimes = Array.from(timeBuckets.keys()).sort();
    const agentIds = [...new Set(data.map(d => d.agentId))];

    return sortedTimes.map(timeKey => {
      const bucket = timeBuckets.get(timeKey)!;
      const point: Record<string, any> = { time: timeKey };
      
      agentIds.forEach(agentId => {
        const cost = bucket.get(agentId);
        point[agentId] = cost || 0;
      });
      
      return point;
    });
  }, [data, timeRange]);

  /**
   * Get unique agent IDs from data
   */
  const agents = useMemo(() => {
    const agentMap = new Map<string, string>();
    data.forEach(d => {
      if (!agentMap.has(d.agentId)) {
        agentMap.set(d.agentId, d.agentName);
      }
    });
    return Array.from(agentMap.entries());
  }, [data]);

  /**
   * Calculate total cost across all agents
   */
  const totalCost = useMemo(() => {
    const latestByAgent = new Map<string, number>();
    data.forEach(d => {
      latestByAgent.set(d.agentId, d.cumulativeCost);
    });
    return Array.from(latestByAgent.values()).reduce((sum, cost) => sum + cost, 0);
  }, [data]);

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    onTimeRangeChange?.(range);
  }, [onTimeRangeChange]);

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
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00f3ff, #9d4edd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Cost Accumulation
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            Real-time spending by agent
          </div>
        </div>
        
        {/* Total Cost Badge */}
        <motion.div
          key={totalCost}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(157, 78, 221, 0.1))',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)'
          }}
        >
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '4px'
          }}>
            Total Cost
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#00f3ff',
            fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(0, 243, 255, 0.5)'
          }}>
            {formatCost(totalCost)}
          </div>
        </motion.div>
      </div>

      {/* Time Range Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px'
      }}>
        {(Object.keys(TIME_RANGE_CONFIG) as TimeRange[]).map(range => (
          <TimeButton
            key={range}
            range={range}
            isActive={timeRange === range}
            onClick={() => handleTimeRangeChange(range)}
          />
        ))}
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {agents.map(([agentId]) => {
                const color = AGENT_COLORS[agentId] || AGENT_COLORS.default;
                return (
                  <linearGradient key={agentId} id={`gradient-${agentId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                );
              })}
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
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 11 }}
              tickFormatter={formatCost}
              label={{ 
                value: 'Cost ($)', 
                angle: -90, 
                position: 'insideLeft',
                offset: 10,
                style: { fill: 'rgba(255, 255, 255, 0.4)', fontSize: 11 }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px' }}
              formatter={(value) => (
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  {value.replace('volt_', '').replace('_', ' ').toUpperCase()}
                </span>
              )}
            />
            {agents.map(([agentId, agentName]) => (
              <Line
                key={agentId}
                type="monotone"
                dataKey={agentId}
                name={agentName}
                stroke={AGENT_COLORS[agentId] || AGENT_COLORS.default}
                strokeWidth={hoveredAgent === agentId ? 4 : 2}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: AGENT_COLORS[agentId] || AGENT_COLORS.default,
                  stroke: '#fff',
                  strokeWidth: 2
                }}
                strokeOpacity={hoveredAgent && hoveredAgent !== agentId ? 0.3 : 1}
                onMouseEnter={() => setHoveredAgent(agentId)}
                onMouseLeave={() => setHoveredAgent(null)}
                animationDuration={500}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {agents.map(([agentId, agentName]) => {
          const latestCost = data
            .filter(d => d.agentId === agentId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          const color = AGENT_COLORS[agentId] || AGENT_COLORS.default;
          
          return (
            <motion.div
              key={agentId}
              whileHover={{ scale: 1.02 }}
              onMouseEnter={() => setHoveredAgent(agentId)}
              onMouseLeave={() => setHoveredAgent(null)}
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: `1px solid ${hoveredAgent === agentId ? color : 'rgba(255, 255, 255, 0.05)'}`,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}`
                }} />
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {agentName.replace('volt_', '').replace('_', ' ')}
                </span>
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: color,
                fontFamily: 'monospace'
              }}>
                {latestCost ? formatCost(latestCost.cumulativeCost) : '$0.0000'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CostChart;
