/**
 * Token Efficiency Chart Component
 * Shows delta vs full file token usage over time
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TokenEfficiency } from '../../types';

interface TokenEfficiencyChartProps {
  data: TokenEfficiency[];
}

const TokenEfficiencyChart: React.FC<TokenEfficiencyChartProps> = ({ data }) => {
  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    deltaTokens: item.deltaTokens / 1000, // Convert to thousands
    fullTokens: item.fullFileTokens / 1000,
    efficiency: item.efficiencyRatio,
    taskType: item.taskType
  }));

  const formatTokenValue = (value: number) => `${value.toFixed(1)}K`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          background: 'white', 
          padding: 12, 
          border: '1px solid #f0f0f0',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{label}</p>
          <p style={{ margin: '4px 0', color: '#1890ff' }}>
            Delta: {formatTokenValue(payload[0].value)}
          </p>
          <p style={{ margin: '4px 0', color: '#52c41a' }}>
            Full: {formatTokenValue(payload[1].value)}
          </p>
          <p style={{ margin: '4px 0', color: '#fa8c16' }}>
            Efficiency: {payload[2].value}%
          </p>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#8c8c8c' }}>
            Task: {payload[0].payload.taskType}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={{ stroke: '#d9d9d9' }}
            tickLine={false}
            tick={{ fill: '#8c8c8c' }}
          />
          <YAxis 
            axisLine={{ stroke: '#d9d9d9' }}
            tickLine={false}
            tick={{ fill: '#8c8c8c' }}
            tickFormatter={formatTokenValue}
            label={{ 
              value: 'Tokens (thousands)', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10,
              style: { fill: '#8c8c8c' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span style={{ color: '#595959', fontSize: 12 }}>
                {value === 'deltaTokens' ? 'Delta Tokens' : 
                 value === 'fullTokens' ? 'Full File Tokens' : 'Efficiency'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="fullTokens"
            stroke="#52c41a"
            fill="#52c41a"
            fillOpacity={0.2}
            name="Full File"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="deltaTokens"
            stroke="#1890ff"
            fill="#1890ff"
            fillOpacity={0.2}
            name="Delta Only"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="efficiency"
            stroke="#fa8c16"
            fill="#fa8c16"
            fillOpacity={0.2}
            name="Efficiency %"
            strokeWidth={2}
            yAxisId="right"
            hide // Hide from main chart, shown in separate chart or tooltip
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Efficiency Stats Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: 16,
        padding: 12,
        background: '#fafafa',
        borderRadius: 6
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>Avg Delta</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1890ff' }}>
            {formatTokenValue(chartData.reduce((sum, d) => sum + d.deltaTokens, 0) / chartData.length)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>Avg Full</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#52c41a' }}>
            {formatTokenValue(chartData.reduce((sum, d) => sum + d.fullTokens, 0) / chartData.length)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>Avg Efficiency</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#fa8c16' }}>
            {(chartData.reduce((sum, d) => sum + d.efficiency, 0) / chartData.length).toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>Savings</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#722ed1' }}>
            {formatTokenValue(
              chartData.reduce((sum, d) => sum + (d.fullTokens - d.deltaTokens), 0)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenEfficiencyChart;