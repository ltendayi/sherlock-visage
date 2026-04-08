import React from 'react';
import { Card, Typography, Space, Segmented, Tooltip } from 'antd';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  LineChartOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import type { TokenEfficiency } from '../../types';

const { Text, Title } = Typography;

interface TokenEfficiencyChartProps {
  data: TokenEfficiency[];
}

/**
 * Token Efficiency Chart component comparing Delta vs Full File token usage
 * Standardized communication visualization for token optimization analysis
 */
const TokenEfficiencyChart: React.FC<TokenEfficiencyChartProps> = ({ data }) => {
  const [timeRange, setTimeRange] = React.useState<'day' | 'week' | 'month'>('week');
  
  const filteredData = React.useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    return data
      .filter(item => new Date(item.timestamp) >= cutoffDate)
      .slice(-10); // Show last 10 data points
  }, [data, timeRange]);

  const calculateSavings = () => {
    const totalDelta = filteredData.reduce((sum, item) => sum + item.deltaTokens, 0);
    const totalFull = filteredData.reduce((sum, item) => sum + item.fullFileTokens, 0);
    const savings = totalFull - totalDelta;
    const percentage = totalFull > 0 ? (savings / totalFull) * 100 : 0;
    
    return { savings, percentage, totalDelta, totalFull };
  };

  const savings = calculateSavings();
  const avgEfficiency = filteredData.length > 0 
    ? filteredData.reduce((sum, item) => sum + item.efficiencyRatio, 0) / filteredData.length
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.8)', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Text strong style={{ color: '#fff', fontSize: '12px' }}>{label}</Text>
          <div style={{ marginTop: '8px' }}>
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '4px'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '2px',
                  background: entry.color 
                }} />
                <Text style={{ color: '#e0e0e0', fontSize: '11px' }}>
                  {entry.name}: {entry.value.toLocaleString()}
                </Text>
              </div>
            ))}
          </div>
          {payload[0] && payload[1] && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Text style={{ color: '#00ff88', fontSize: '11px' }}>
                Efficiency: {((payload[0].value / payload[1].value) * 100).toFixed(1)}%
              </Text>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      className="glass-panel glass-panel-hover"
      style={{ 
        height: '100%',
        borderRadius: '16px'
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space align="center" size="small">
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #9d4edd 0%, #1890ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LineChartOutlined style={{ fontSize: '18px', color: '#fff' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
                Token Efficiency
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Delta vs Full File Comparison
              </Text>
            </div>
          </Space>
          
          <Segmented
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' }
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value as any)}
            size="small"
          />
        </div>

        {/* Summary Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          marginTop: '8px'
        }}>
          <div style={{ 
            padding: '12px', 
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 136, 0.3)'
          }}>
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Total Savings</Text>
              <Text strong style={{ fontSize: '18px', color: '#00ff88' }}>
                {savings.savings.toLocaleString()} tokens
              </Text>
              <Text style={{ fontSize: '11px', color: '#00ff88' }}>
                {savings.percentage.toFixed(1)}% reduction
              </Text>
            </Space>
          </div>
          
          <div style={{ 
            padding: '12px', 
            background: 'rgba(157, 78, 221, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(157, 78, 221, 0.3)'
          }}>
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Avg Efficiency</Text>
              <Text strong style={{ fontSize: '18px', color: '#9d4edd' }}>
                {avgEfficiency.toFixed(2)}x
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {avgEfficiency > 2 ? (
                  <>
                    <CheckCircleOutlined style={{ color: '#00ff88', fontSize: '11px' }} />
                    <Text style={{ fontSize: '11px', color: '#00ff88' }}>Optimal</Text>
                  </>
                ) : (
                  <>
                    <WarningOutlined style={{ color: '#ff8c00', fontSize: '11px' }} />
                    <Text style={{ fontSize: '11px', color: '#ff8c00' }}>Needs review</Text>
                  </>
                )}
              </div>
            </Space>
          </div>
          
          <div style={{ 
            padding: '12px', 
            background: 'rgba(24, 144, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(24, 144, 255, 0.3)'
          }}>
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Delta Usage</Text>
              <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                {savings.totalDelta.toLocaleString()}
              </Text>
              <Text style={{ fontSize: '11px', color: '#1890ff' }}>
                vs {savings.totalFull.toLocaleString()} full
              </Text>
            </Space>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '300px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData.map(item => ({
                ...item,
                timestamp: new Date(item.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                efficiency: item.efficiencyRatio
              }))}
              margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)"
                vertical={false}
              />
              <XAxis 
                dataKey="timestamp" 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine 
                y={0} 
                stroke="rgba(255, 255, 255, 0.3)" 
                strokeWidth={1}
              />
              <Bar 
                name="Delta Tokens" 
                dataKey="deltaTokens" 
                fill="#00ff88"
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                {filteredData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.efficiencyRatio > 2 ? '#00ff88' : entry.efficiencyRatio > 1 ? '#9d4edd' : '#ff8c00'}
                  />
                ))}
              </Bar>
              <Bar 
                name="Full File Tokens" 
                dataKey="fullFileTokens" 
                fill="#1890ff"
                radius={[4, 4, 0, 0]}
                barSize={24}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency Legend */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px'
        }}>
          <Space size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '2px',
                background: '#00ff88' 
              }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>High Efficiency (&gt;2x)</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '2px',
                background: '#9d4edd' 
              }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>Good Efficiency (1-2x)</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '2px',
                background: '#ff8c00' 
              }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>Needs Improvement (&lt;1x)</Text>
            </div>
          </Space>
          
          <Tooltip title="Delta tokens represent incremental changes, while full file tokens represent complete file processing">
            <InfoCircleOutlined style={{ color: '#a0a0a0', fontSize: '14px' }} />
          </Tooltip>
        </div>

        {/* Recommendations */}
        {avgEfficiency < 2 && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(255, 140, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 140, 0, 0.3)'
          }}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: '12px', color: '#ff8c00' }}>
                <WarningOutlined /> Optimization Recommendations
              </Text>
              <Text style={{ fontSize: '11px', color: '#e0e0e0' }}>
                • Review tasks with efficiency below 2x
                • Optimize delta detection algorithms
                • Consider batch processing for similar tasks
                • Monitor delegate #3 and #5 token usage patterns
              </Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default TokenEfficiencyChart;