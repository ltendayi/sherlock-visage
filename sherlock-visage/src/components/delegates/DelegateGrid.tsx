/**
 * Delegate Grid Component
 * Displays AI delegate nodes in a responsive grid
 */

import React from 'react';
import { Card, Row, Col, Badge, Tag, Progress, Tooltip } from 'antd';
import { 
  CrownOutlined, 
  SafetyOutlined, 
  CodeOutlined, 
  ExperimentOutlined,
  CalculatorOutlined,
  AlertOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import type { DelegateNode } from '../../types';

interface DelegateGridProps {
  delegates: DelegateNode[];
  onDelegateClick: (delegateId: string) => void;
  compact?: boolean;
}

const DelegateGrid: React.FC<DelegateGridProps> = ({ 
  delegates, 
  onDelegateClick,
  compact = false 
}) => {
  const getDelegateIcon = (type: DelegateNode['type']) => {
    switch (type) {
      case 'archivist': return <FileTextOutlined />;
      case 'strategist': return <CrownOutlined />;
      case 'analyst': return <CalculatorOutlined />;
      case 'executor': return <CodeOutlined />;
      case 'validator': return <SafetyOutlined />;
      case 'monitor': return <AlertOutlined />;
      case 'coordinator': return <ExperimentOutlined />;
      default: return <CodeOutlined />;
    }
  };

  const getStatusColor = (status: DelegateNode['status']) => {
    switch (status) {
      case 'active': return '#52c41a';
      case 'busy': return '#fa8c16';
      case 'idle': return '#8c8c8c';
      case 'error': return '#f5222d';
      default: return '#8c8c8c';
    }
  };

  const getTypeColor = (type: DelegateNode['type']) => {
    switch (type) {
      case 'archivist': return '#722ed1';
      case 'strategist': return '#1890ff';
      case 'analyst': return '#fa8c16';
      case 'executor': return '#52c41a';
      case 'validator': return '#f5222d';
      case 'monitor': return '#13c2c2';
      case 'coordinator': return '#eb2f96';
      default: return '#8c8c8c';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const DelegateCard = ({ delegate }: { delegate: DelegateNode }) => (
    <Card
      hoverable
      size="small"
      onClick={() => onDelegateClick(delegate.id)}
      style={{ 
        cursor: 'pointer',
        borderLeft: `4px solid ${getTypeColor(delegate.type)}`,
        height: '100%'
      }}
      bodyStyle={{ padding: compact ? 12 : 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: compact ? 8 : 12 }}>
        <div style={{ 
          background: getTypeColor(delegate.type),
          padding: 8,
          borderRadius: 6,
          marginRight: 12,
          color: 'white'
        }}>
          {getDelegateIcon(delegate.type)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: 500, fontSize: compact ? 14 : 16 }}>
              {delegate.name}
            </div>
            <Badge 
              status={delegate.status === 'active' ? 'success' : 
                     delegate.status === 'busy' ? 'warning' :
                     delegate.status === 'error' ? 'error' : 'default'}
              text={delegate.status}
              style={{ fontSize: 12 }}
            />
          </div>
          {!compact && (
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              Last active: {formatTime(delegate.lastActive)}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <>
          {/* Resource Usage */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
              Resource Usage
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Tooltip title={`CPU: ${delegate.cpuUsage.toFixed(1)}%`}>
                <Progress
                  type="circle"
                  percent={delegate.cpuUsage}
                  size={40}
                  strokeColor={delegate.cpuUsage > 80 ? '#f5222d' : '#1890ff'}
                  format={() => (
                    <div style={{ fontSize: 10, color: '#595959' }}>CPU</div>
                  )}
                />
              </Tooltip>
              <Tooltip title={`Memory: ${delegate.memoryUsage.toFixed(1)}%`}>
                <Progress
                  type="circle"
                  percent={delegate.memoryUsage}
                  size={40}
                  strokeColor={delegate.memoryUsage > 80 ? '#f5222d' : '#52c41a'}
                  format={() => (
                    <div style={{ fontSize: 10, color: '#595959' }}>MEM</div>
                  )}
                />
              </Tooltip>
              <Tooltip title={`Tokens: ${delegate.tokenUsage}`}>
                <div style={{ 
                  padding: 8,
                  background: '#f6ffed',
                  borderRadius: 6,
                  textAlign: 'center',
                  flex: 1
                }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Tokens</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{delegate.tokenUsage}</div>
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Glow Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Activity</div>
            <div style={{ 
              width: 60, 
              height: 8,
              background: `linear-gradient(90deg, ${delegate.color} ${delegate.glowIntensity * 100}%, #f0f0f0 ${delegate.glowIntensity * 100}%)`,
              borderRadius: 4
            }} />
          </div>
        </>
      )}

      {compact && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#8c8c8c'
        }}>
          <span>Tokens: {delegate.tokenUsage}</span>
          <span>CPU: {delegate.cpuUsage.toFixed(0)}%</span>
          <Tag color={getStatusColor(delegate.status)} style={{ margin: 0, fontSize: 10 }}>
            {delegate.type}
          </Tag>
        </div>
      )}
    </Card>
  );

  return (
    <Row gutter={[8, 8]}>
      {delegates.map(delegate => (
        <Col 
          key={delegate.id} 
          span={compact ? 24 : 12}
          style={{ height: compact ? 'auto' : 180 }}
        >
          <DelegateCard delegate={delegate} />
        </Col>
      ))}
    </Row>
  );
};

export default DelegateGrid;