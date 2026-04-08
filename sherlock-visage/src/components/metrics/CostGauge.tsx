import React from 'react';
import { Card, Progress, Space, Typography, Statistic, Tooltip } from 'antd';
import { 
  DollarOutlined, 
  RiseOutlined, 
  FallOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import type { CostMetrics } from '../../types';

const { Text, Title } = Typography;

interface CostGaugeProps {
  metrics: CostMetrics;
}

/**
 * Cost Gauge component for monitoring budget and expenditures
 * Standardized communication gauge showing $280-570 monthly budget range
 */
const CostGauge: React.FC<CostGaugeProps> = ({ metrics }) => {
  const { 
    monthlyBudget, 
    currentSpend, 
    projectedSpend, 
    dailyAverage, 
    costPerToken,
    budgetRange 
  } = metrics;

  const spendPercentage = (currentSpend / monthlyBudget) * 100;
  const projectedPercentage = (projectedSpend / monthlyBudget) * 100;
  const budgetMidpoint = (budgetRange.min + budgetRange.max) / 2;
  
  const getSpendStatus = () => {
    if (currentSpend < budgetRange.min) return 'under';
    if (currentSpend > budgetRange.max) return 'over';
    if (currentSpend > budgetMidpoint) return 'warning';
    return 'optimal';
  };

  const status = getSpendStatus();
  const statusColors = {
    under: '#2ed573',
    optimal: '#00ff88',
    warning: '#ff8c00',
    over: '#ff4757'
  };
  
  const statusText = {
    under: 'Under Budget',
    optimal: 'Optimal',
    warning: 'Approaching Limit',
    over: 'Over Budget'
  };

  return (
    <Card 
      className="glass-panel glass-panel-hover"
      style={{ 
        height: '100%',
        borderRadius: '16px',
        border: `1px solid ${statusColors[status]}` 
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
              background: 'linear-gradient(135deg, #00ff88 0%, #1890ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarOutlined style={{ fontSize: '18px', color: '#fff' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
                Cost Monitoring
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Monthly Budget: ${monthlyBudget.toLocaleString()}
              </Text>
            </div>
          </Space>
          
          <div style={{ 
            padding: '4px 12px', 
            background: `${statusColors[status]}20`,
            borderRadius: '20px',
            border: `1px solid ${statusColors[status]}` 
          }}>
            <Text style={{ 
              fontSize: '12px', 
              color: statusColors[status],
              fontWeight: 500 
            }}>
              {statusText[status]}
            </Text>
          </div>
        </div>

        {/* Budget Range Gauge */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '4px' 
          }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Min: ${budgetRange.min}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Max: ${budgetRange.max}
            </Text>
          </div>
          
          <div style={{ 
            height: '8px', 
            background: 'linear-gradient(90deg, #2ed573, #ff8c00, #ff4757)',
            borderRadius: '4px',
            position: 'relative',
            marginBottom: '8px'
          }}>
            {/* Current Spend Marker */}
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(spendPercentage, 100)}%`,
                top: '-6px',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '20px',
                background: statusColors[status],
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: `0 0 10px ${statusColors[status]}`
              }}
            >
              <Tooltip title={`Current: $${currentSpend}`}>
                <div style={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#fff',
                    borderRadius: '50%' 
                  }} />
                </div>
              </Tooltip>
            </div>

            {/* Projected Marker */}
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(projectedPercentage, 100)}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '12px',
                height: '12px',
                background: '#fff',
                borderRadius: '50%',
                border: '2px solid #1890ff'
              }}
            >
              <Tooltip title={`Projected: $${projectedSpend}`}>
                <div style={{ width: '100%', height: '100%' }} />
              </Tooltip>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '12px', color: statusColors[status] }}>
              Current: ${currentSpend}
            </Text>
            <Text style={{ fontSize: '12px', color: '#1890ff' }}>
              Projected: ${projectedSpend}
            </Text>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '16px',
          marginTop: '16px'
        }}>
          <Statistic
            title="Daily Average"
            value={dailyAverage}
            prefix="$"
            valueStyle={{ 
              color: dailyAverage > (monthlyBudget / 30) ? '#ff8c00' : '#2ed573',
              fontSize: '20px',
              fontWeight: 600
            }}
            suffix={
              dailyAverage > (monthlyBudget / 30) ? 
                <RiseOutlined style={{ color: '#ff8c00', fontSize: '14px' }} /> :
                <FallOutlined style={{ color: '#2ed573', fontSize: '14px' }} />
            }
          />
          
          <Statistic
            title="Cost per Token"
            value={costPerToken}
            precision={4}
            valueStyle={{ 
              color: costPerToken > 0.002 ? '#ff8c00' : '#2ed573',
              fontSize: '20px',
              fontWeight: 600
            }}
            suffix="USD"
          />
        </div>

        {/* Efficiency Progress */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Budget Efficiency</Text>
            <Text style={{ fontSize: '12px', fontWeight: 500 }}>
              {Math.round((budgetMidpoint / currentSpend) * 100)}%
            </Text>
          </div>
          <Progress 
            percent={Math.min((budgetMidpoint / currentSpend) * 100, 100)}
            strokeColor={statusColors[status]}
            trailColor="rgba(255, 255, 255, 0.1)"
            showInfo={false}
          />
        </div>

        {/* Alert Message */}
        {status === 'warning' && (
          <div style={{ 
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(255, 140, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 140, 0, 0.3)'
          }}>
            <Space size="small">
              <ExclamationCircleOutlined style={{ color: '#ff8c00' }} />
              <Text style={{ fontSize: '12px', color: '#ff8c00' }}>
                Current spend approaching budget limit. Projected to reach ${projectedSpend} this month.
              </Text>
            </Space>
          </div>
        )}
        
        {status === 'over' && (
          <div style={{ 
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(255, 71, 87, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 71, 87, 0.3)'
          }}>
            <Space size="small">
              <ExclamationCircleOutlined style={{ color: '#ff4757' }} />
              <Text style={{ fontSize: '12px', color: '#ff4757' }}>
                Budget exceeded! Current spend is ${currentSpend - budgetRange.max} over limit.
              </Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default CostGauge;