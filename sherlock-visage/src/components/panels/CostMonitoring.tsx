/**
 * Cost Monitoring Panel Component
 * Displays budget, spending, and cost metrics
 */

import React from 'react';
import { Progress, Row, Col, Typography, Tooltip } from 'antd';
import { DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import type { CostMetrics } from '../../types';

const { Text, Title } = Typography;

interface CostMonitoringProps {
  metrics: CostMetrics;
}

const CostMonitoring: React.FC<CostMonitoringProps> = ({ metrics }) => {
  const {
    monthlyBudget,
    currentSpend,
    projectedSpend,
    dailyAverage,
    costPerToken,
    budgetRange
  } = metrics;

  const currentSpendPercentage = (currentSpend / monthlyBudget) * 100;
  const projectedSpendPercentage = (projectedSpend / monthlyBudget) * 100;
  const budgetMinPercentage = (budgetRange.min / monthlyBudget) * 100;
  const budgetMaxPercentage = (budgetRange.max / monthlyBudget) * 100;

  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return '#52c41a'; // Green
    if (percentage < 85) return '#fa8c16'; // Orange
    return '#f5222d'; // Red
  };

  const getSpendingStatus = () => {
    if (currentSpend < budgetRange.min) return 'Below Budget';
    if (currentSpend > budgetRange.max) return 'Over Budget';
    return 'Within Budget';
  };

  return (
    <div style={{ padding: 8 }}>
      {/* Budget Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text type="secondary">Monthly Budget: ${monthlyBudget}</Text>
          <Text style={{ color: getProgressColor(currentSpendPercentage) }}>
            {getSpendingStatus()}
          </Text>
        </div>
        
        <Progress 
          percent={Math.min(currentSpendPercentage, 100)}
          strokeColor={getProgressColor(currentSpendPercentage)}
          trailColor="#f0f0f0"
          size={['100%', 16]}
          showInfo={false}
        />
        
        {/* Budget range markers */}
        <div style={{ position: 'relative', height: 20, marginTop: 4 }}>
          <div style={{ position: 'absolute', left: `${budgetMinPercentage}%`, height: '100%', borderLeft: '2px dashed #1890ff', paddingLeft: 4 }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Min: ${budgetRange.min}</Text>
          </div>
          <div style={{ position: 'absolute', left: `${budgetMaxPercentage}%`, height: '100%', borderLeft: '2px dashed #f5222d', paddingLeft: 4 }}>
            <Text type="secondary" style={{ fontSize: 10 }}>Max: ${budgetRange.max}</Text>
          </div>
        </div>
      </div>

      {/* Spending Stats */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f6ffed', padding: 12, borderRadius: 6 }}>
              <DollarOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
              <Title level={4} style={{ margin: 0 }}>${currentSpend}</Title>
              <Text type="secondary">Current Spend</Text>
            </div>
          </div>
        </Col>
        
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff7e6', padding: 12, borderRadius: 6 }}>
              <RiseOutlined style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }} />
              <Title level={4} style={{ margin: 0 }}>${projectedSpend}</Title>
              <Text type="secondary">Projected</Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* Additional Metrics */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 6 }}>
            <Text type="secondary">Daily Average</Text>
            <Title level={5} style={{ margin: '4px 0' }}>${dailyAverage.toFixed(1)}</Title>
          </div>
        </Col>
        
        <Col span={12}>
          <div style={{ padding: 12, background: '#f6ffed', borderRadius: 6 }}>
            <Tooltip title="Cost per 1000 tokens">
              <div>
                <Text type="secondary">Cost/Token</Text>
                <Title level={5} style={{ margin: '4px 0' }}>${(costPerToken * 1000).toFixed(2)}/1K</Title>
              </div>
            </Tooltip>
          </div>
        </Col>
      </Row>

      {/* Efficiency Note */}
      {currentSpend < budgetRange.max && (
        <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 6 }}>
          <Text style={{ color: '#1890ff' }}>
            <FallOutlined style={{ marginRight: 8 }} />
            Efficiency: ${(budgetRange.max - currentSpend).toFixed(0)} under max budget
          </Text>
        </div>
      )}
    </div>
  );
};

export default CostMonitoring;
