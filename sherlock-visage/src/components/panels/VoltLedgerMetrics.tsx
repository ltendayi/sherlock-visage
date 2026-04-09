/**
 * VoltLedgerMetrics Panel Component
 * Comprehensive dashboard panel for VoltLedger fintech operations
 * Includes: Loan portfolio, bike fleet, M-Pesa transactions, revenue streams
 * Dark Vanta theme with glass-morphism cards
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import type { 
  LoanPortfolio, 
  BikeFleet, 
  TransactionVolume, 
  RevenueStream,
  SyncState 
} from '../../types/voltledger';

interface VoltLedgerMetricsProps {
  portfolio: LoanPortfolio | null;
  fleet: BikeFleet | null;
  transactions: TransactionVolume | null;
  revenue: RevenueStream[];
  sync: SyncState | null;
  isLoading?: boolean;
}

// Sync status configuration
const SYNC_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  connected: { color: '#00ff88', label: 'Connected', icon: '✓' },
  disconnected: { color: '#ff4444', label: 'Offline', icon: '✕' },
  syncing: { color: '#00f3ff', label: 'Syncing', icon: '🔄' },
  lagging: { color: '#ff8c00', label: 'Lag', icon: '⚠️' },
  error: { color: '#ff006e', label: 'Error', icon: '⚠️' }
};

// Loan status colors
const LOAN_STATUS_COLORS: Record<string, string> = {
  active: '#00f3ff',
  repaid: '#00ff88',
  defaulted: '#ff4444',
  pending: '#ff8c00',
  suspended: '#9d4edd'
};

// Bike status colors
const BIKE_STATUS_COLORS: Record<string, string> = {
  available: '#00ff88',
  'on-loan': '#00f3ff',
  maintenance: '#ff8c00',
  retired: '#ff4444',
  stolen: '#9d4edd'
};

/**
 * Format currency
 */
const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `KSh ${(value / 1000).toFixed(1)}K`;
  return `KSh ${value.toFixed(0)}`;
};

/**
 * Format number with commas
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Format percentage
 */
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Custom Tooltip for Revenue Chart
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
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton: React.FC = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    height: '100%'
  }}>
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        style={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          height: '100%'
        }}
      >
        <div style={{
          height: '16px',
          width: '120px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          marginBottom: '16px'
        }} />
        <div style={{
          height: '40px',
          width: '80%',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          marginBottom: '8px'
        }} />
        <div style={{
          height: '12px',
          width: '60%',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '4px'
        }} />
      </motion.div>
    ))}
  </div>
);

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  icon: string;
  trend?: { value: number; positive: boolean };
  delay?: number;
}> = ({ title, value, subtitle, color, icon, trend, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.02, y: -2 }}
    style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '16px',
      border: `1px solid ${color}20`,
      boxShadow: `0 4px 30px ${color}10`,
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
      background: `radial-gradient(circle, ${color}30, transparent)`,
      opacity: 0.5,
      pointerEvents: 'none'
    }} />

    {/* Header */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    }}>
      <div style={{
        fontSize: '24px',
        filter: `drop-shadow(0 0 10px ${color})`
      }}>
        {icon}
      </div>
      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: trend.positive ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
          fontSize: '11px',
          fontWeight: 600,
          color: trend.positive ? '#00ff88' : '#ff4444'
        }}>
          {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>

    {/* Value */}
    <div style={{
      fontSize: '28px',
      fontWeight: 700,
      color: color,
      fontFamily: 'monospace',
      textShadow: `0 0 20px ${color}50`,
      marginBottom: '4px',
      lineHeight: 1
    }}>
      {value}
    </div>

    {/* Label */}
    <div style={{
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.6)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: subtitle ? '4px' : 0
    }}>
      {title}
    </div>

    {/* Subtitle */}
    {subtitle && (
      <div style={{
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        {subtitle}
      </div>
    )}
  </motion.div>
);

/**
 * Status Badge Component
 */
const StatusBadge: React.FC<{ status: string; text: string }> = ({ status, text }) => {
  const config = SYNC_CONFIG[status] || SYNC_CONFIG.disconnected;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        background: `${config.color}15`,
        border: `1px solid ${config.color}40`,
        fontSize: '11px',
        fontWeight: 600,
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      <span>{config.icon}</span>
      {text}
    </motion.div>
  );
};

export const VoltLedgerMetrics: React.FC<VoltLedgerMetricsProps> = ({
  portfolio,
  fleet,
  transactions,
  revenue,
  sync,
  isLoading = false
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '7D' | '30D'>('7D');

  // Transform revenue data for chart
  const revenueChartData = useMemo(() => {
    return revenue.map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      total: r.totalRevenue,
      interest: r.interestIncome,
      fees: r.feeIncome,
      penalties: r.penaltyIncome
    }));
  }, [revenue]);

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    return revenue.reduce((sum, r) => sum + r.totalRevenue, 0);
  }, [revenue]);

  if (isLoading) {
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00f3ff, #9d4edd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            VoltLedger Bridge
          </h3>
        </div>
        <LoadingSkeleton />
      </motion.div>
    );
  }

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
        boxShadow: '0 20px 80px rgba(0, 0, 0, 0.8)',
        maxHeight: '600px',
        overflowY: 'auto'
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
            VoltLedger Bridge
          </h3>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '4px'
          }}>
            Fintech Operations Dashboard
          </div>
        </div>
        <StatusBadge 
          status={sync?.status || 'disconnected'} 
          text={sync?.status === 'connected' ? 'Live Sync' : 'Offline'} 
        />
      </div>

      {/* Loan Portfolio Cards */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Loan Portfolio
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          <MetricCard
            title="Active Loans"
            value={formatNumber(portfolio?.activeLoans || 0)}
            subtitle={`of ${formatNumber(portfolio?.totalLoans || 0)} total`}
            color="#00f3ff"
            icon="📄"
            delay={0}
          />
          <MetricCard
            title="Portfolio Value"
            value={formatCurrency(portfolio?.totalPortfolioValue || 0)}
            subtitle={`${formatCurrency(portfolio?.totalOutstanding || 0)} outstanding`}
            color="#00ff88"
            icon="💰"
            delay={0.1}
          />
          <MetricCard
            title="Default Rate"
            value={formatPercent(portfolio?.defaultRate || 0)}
            subtitle={`${formatNumber(portfolio?.defaultedLoans || 0)} defaulted`}
            color="#ff4444"
            icon="⚠️"
            trend={{ value: 2.5, positive: false }}
            delay={0.2}
          />
          <MetricCard
            title="Collection Rate"
            value={formatPercent(portfolio?.collectionRate || 0)}
            subtitle="Repaid on time"
            color="#9d4edd"
            icon="✓"
            trend={{ value: 5.2, positive: true }}
            delay={0.3}
          />
        </div>
      </div>

      {/* Bike Fleet Status */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Bike Fleet Status
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { key: 'available', label: 'Available', value: fleet?.availableBikes || 0 },
            { key: 'on-loan', label: 'On Loan', value: fleet?.onLoanBikes || 0 },
            { key: 'maintenance', label: 'Service', value: fleet?.maintenanceBikes || 0 },
            { key: 'retired', label: 'Retired', value: fleet?.retiredBikes || 0 }
          ].map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              style={{
                textAlign: 'center',
                padding: '12px',
                background: `${BIKE_STATUS_COLORS[item.key]}10`,
                borderRadius: '10px',
                border: `1px solid ${BIKE_STATUS_COLORS[item.key]}30`
              }}
            >
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: BIKE_STATUS_COLORS[item.key],
                fontFamily: 'monospace',
                textShadow: `0 0 10px ${BIKE_STATUS_COLORS[item.key]}50`
              }}>
                {formatNumber(item.value)}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px'
              }}>
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
        {/* Utilization Rate */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(0, 243, 255, 0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(0, 243, 255, 0.1)'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Fleet Utilization
          </span>
          <span style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#00f3ff',
            fontFamily: 'monospace'
          }}>
            {formatPercent(fleet?.utilizationRate || 0)}
          </span>
        </div>
      </div>

      {/* M-Pesa Transaction Volume */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          M-Pesa Transaction Volume
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px'
        }}>
          {[
            { 
              label: 'Daily', 
              volume: transactions?.dailyVolume || 0, 
              count: transactions?.dailyCount || 0,
              color: '#00f3ff'
            },
            { 
              label: 'Weekly', 
              volume: transactions?.weeklyVolume || 0, 
              count: transactions?.weeklyCount || 0,
              color: '#9d4edd'
            },
            { 
              label: 'Monthly', 
              volume: transactions?.monthlyVolume || 0, 
              count: transactions?.monthlyCount || 0,
              color: '#00ff88'
            }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${item.color}20`,
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: item.color,
                fontFamily: 'monospace',
                marginBottom: '4px'
              }}>
                {formatCurrency(item.volume)}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {formatNumber(item.count)} transactions
              </div>
              <div style={{
                fontSize: '10px',
                color: item.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '8px',
                opacity: 0.7
              }}>
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
        {/* Success Rate */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(0, 255, 136, 0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(0, 255, 136, 0.1)'
        }}>
          <span style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Transaction Success Rate
          </span>
          <span style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#00ff88',
            fontFamily: 'monospace'
          }}>
            {formatPercent(transactions?.successRate || 0)}
          </span>
        </div>
      </div>

      {/* Revenue Stream Chart */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h4 style={{
            margin: 0,
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Revenue Stream
          </h4>
          
          {/* Period Selector */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {(['1D', '7D', '30D'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedPeriod === period ? '#00f3ff' : 'rgba(255, 255, 255, 0.1)',
                  background: selectedPeriod === period 
                    ? 'rgba(0, 243, 255, 0.1)' 
                    : 'transparent',
                  color: selectedPeriod === period ? '#00f3ff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(157, 78, 221, 0.1))',
          borderRadius: '12px',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px'
            }}>
              Total Revenue
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#00f3ff',
              fontFamily: 'monospace',
              textShadow: '0 0 20px rgba(0, 243, 255, 0.5)'
            }}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#00f3ff',
            boxShadow: '0 0 20px #00f3ff',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <AreaChart
              data={revenueChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="totalRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="interestIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 10 }}
                tickFormatter={(value) => `KSh${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Revenue"
                stroke="#00f3ff"
                strokeWidth={2}
                fill="url(#totalRevenue)"
                animationDuration={500}
              />
              <Area
                type="monotone"
                dataKey="interest"
                name="Interest Income"
                stroke="#00ff88"
                strokeWidth={2}
                fill="url(#interestIncome)"
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: '#00f3ff',
              borderRadius: '2px'
            }} />
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Total Revenue
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              background: '#00ff88',
              borderRadius: '2px'
            }} />
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Interest Income
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        <span>VoltLedger Bridge • {sync?.voltledgerVersion || 'v1.0.0'}</span>
        <span style={{ fontFamily: 'monospace' }}>
          {sync?.lastSyncAt 
            ? `Last sync: ${new Date(sync.lastSyncAt).toLocaleTimeString()}` 
            : 'Never synced'}
        </span>
      </div>
    </motion.div>
  );
};

export default VoltLedgerMetrics;
