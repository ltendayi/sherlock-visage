import React from 'react';
import { Card, Progress, Space, Typography, Row, Col, Tooltip } from 'antd';
import { 
  DashboardOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { SystemHealth } from '../../types';

const { Text, Title } = Typography;

interface SystemHealthDialProps {
  health: SystemHealth;
}

/**
 * System Health Dial component showing overall system health status
 * Standardized communication dial with 80% target indicator
 */
const SystemHealthDial: React.FC<SystemHealthDialProps> = ({ health }) => {
  const { 
    overall, 
    networkLatency, 
    apiAvailability, 
    databaseHealth, 
    queueDepth,
    lastUpdated 
  } = health;

  const getHealthStatus = (value: number) => {
    if (value >= 90) return { color: '#00ff88', status: 'Excellent', icon: <CheckCircleOutlined /> };
    if (value >= 80) return { color: '#2ed573', status: 'Good', icon: <CheckCircleOutlined /> };
    if (value >= 70) return { color: '#ff8c00', status: 'Fair', icon: <WarningOutlined /> };
    return { color: '#ff4757', status: 'Poor', icon: <ExclamationCircleOutlined /> };
  };

  const overallStatus = getHealthStatus(overall);
  const targetPercentage = 80;

  const components = [
    {
      name: 'API Availability',
      value: apiAvailability,
      icon: <ApiOutlined />,
      description: 'API endpoint responsiveness'
    },
    {
      name: 'Database Health',
      value: databaseHealth,
      icon: <DatabaseOutlined />,
      description: 'Database connection and performance'
    },
    {
      name: 'Network Latency',
      value: 100 - Math.min(networkLatency / 100, 1) * 100,
      icon: <CloudServerOutlined />,
      description: 'Network response times'
    },
    {
      name: 'Queue Depth',
      value: 100 - Math.min(queueDepth / 50, 1) * 100,
      icon: <ClockCircleOutlined />,
      description: 'Task processing queue'
    }
  ];

  return (
    <Card 
      className="glass-panel glass-panel-hover"
      style={{ 
        height: '100%',
        borderRadius: '16px',
        border: `1px solid ${overallStatus.color}40`
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
              background: `linear-gradient(135deg, ${overallStatus.color} 0%, #1890ff 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DashboardOutlined style={{ fontSize: '18px', color: '#fff' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
                System Health
              </Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Target: {targetPercentage}% • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </Text>
            </div>
          </Space>
          
          <div style={{ 
            padding: '4px 12px', 
            background: `${overallStatus.color}20`,
            borderRadius: '20px',
            border: `1px solid ${overallStatus.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {overallStatus.icon}
            <Text style={{ 
              fontSize: '12px', 
              color: overallStatus.color,
              fontWeight: 500 
            }}>
              {overallStatus.status}
            </Text>
          </div>
        </div>

        {/* Main Health Dial */}
        <div style={{ position: 'relative', height: '180px', margin: '20px 0' }}>
          {/* Background Circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }} />
          
          {/* Progress Circle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px'
          }}>
            <Progress
              type="circle"
              percent={overall}
              strokeColor={overallStatus.color}
              trailColor="rgba(255, 255, 255, 0.1)"
              strokeWidth={8}
              size={140}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold',
                    color: overallStatus.color 
                  }}>
                    {overall}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                    Overall Health
                  </Text>
                </div>
              )}
            />
          </div>
          
          {/* Target Indicator */}
          <motion.div
            animate={{
              rotate: [0, 10, 0, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '180px',
              height: '180px'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '20px',
              background: '#ff8c00'
            }} />
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: '#ff8c00',
              fontWeight: 'bold',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #ff8c00'
            }}>
              Target {targetPercentage}%
            </div>
          </motion.div>
          
          {/* Status Indicators */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {components.map((comp, index) => {
              const status = getHealthStatus(comp.value);
              return (
                <Tooltip key={index} title={`${comp.name}: ${comp.value}% - ${comp.description}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ color: status.color, fontSize: '12px' }}>
                      {comp.icon}
                    </div>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%',
                      background: status.color
                    }} />
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Component Health Grid */}
        <Row gutter={[12, 12]}>
          {components.map((component, index) => {
            const status = getHealthStatus(component.value);
            return (
              <Col span={12} key={index}>
                <div style={{ 
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: `1px solid ${status.color}30`
                }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Space size="small">
                        <div style={{ color: status.color, fontSize: '12px' }}>
                          {component.icon}
                        </div>
                        <Text style={{ fontSize: '12px', color: '#e0e0e0' }}>
                          {component.name}
                        </Text>
                      </Space>
                      <Text style={{ 
                        fontSize: '12px', 
                        color: status.color,
                        fontWeight: 500 
                      }}>
                        {component.value}%
                      </Text>
                    </div>
                    <Progress 
                      percent={component.value}
                      strokeColor={status.color}
                      trailColor="rgba(255, 255, 255, 0.1)"
                      showInfo={false}
                      size="small"
                    />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {component.description}
                    </Text>
                  </Space>
                </div>
              </Col>
            );
          })}
        </Row>

        {/* Health Alerts */}
        {overall < targetPercentage && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(255, 140, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 140, 0, 0.3)'
          }}>
            <Space direction="vertical" size={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExclamationCircleOutlined style={{ color: '#ff8c00' }} />
                <Text strong style={{ fontSize: '12px', color: '#ff8c00' }}>
                  System Health Below Target
                </Text>
              </div>
              <Text style={{ fontSize: '11px', color: '#e0e0e0' }}>
                Overall system health at {overall}% is below the {targetPercentage}% target. 
                Focus on improving {components.find(c => c.value < 80)?.name?.toLowerCase() || 'critical components'}.
              </Text>
            </Space>
          </div>
        )}

        {overall >= 90 && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 255, 136, 0.3)'
          }}>
            <Space direction="vertical" size={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircleOutlined style={{ color: '#00ff88' }} />
                <Text strong style={{ fontSize: '12px', color: '#00ff88' }}>
                  System Health Optimal
                </Text>
              </div>
              <Text style={{ fontSize: '11px', color: '#e0e0e0' }}>
                All systems operating within optimal parameters. No action required.
              </Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default SystemHealthDial;