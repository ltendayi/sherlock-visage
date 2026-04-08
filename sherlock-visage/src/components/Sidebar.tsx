import React from 'react';
import { Menu, Space, Typography, Divider, Progress } from 'antd';
import { 
  DashboardOutlined,
  TeamOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
  SafetyOutlined,
  ApiOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  AlertOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text } = Typography;

/**
 * Sidebar component for navigation and system overview
 * Standardized communication sidebar with quick access to dashboard sections
 */
const Sidebar: React.FC = () => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard Overview'
    },
    {
      key: 'delegates',
      icon: <TeamOutlined />,
      label: 'AI Delegates',
      children: [
        { key: 'analysts', label: 'Analysts Team' },
        { key: 'strategists', label: 'Strategists Team' },
        { key: 'coordinators', label: 'Coordinators' }
      ]
    },
    {
      key: 'analytics',
      icon: <LineChartOutlined />,
      label: 'Analytics',
      children: [
        { key: 'cost-analytics', label: 'Cost Analysis' },
        { key: 'token-analytics', label: 'Token Efficiency' },
        { key: 'performance', label: 'Performance Metrics' }
      ]
    },
    {
      key: 'data',
      icon: <DatabaseOutlined />,
      label: 'Data Management'
    },
    {
      key: 'api',
      icon: <ApiOutlined />,
      label: 'API Integrations'
    },
    {
      key: 'monitoring',
      icon: <CloudServerOutlined />,
      label: 'System Monitoring'
    },
    {
      key: 'documentation',
      icon: <FileTextOutlined />,
      label: 'Documentation'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    }
  ];

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '24px 16px'
    }}>
      {/* System Status Overview */}
      <div style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '14px', color: '#e0e0e0' }}>
              System Status
            </Text>
            <SafetyOutlined style={{ color: '#00ff88', fontSize: '16px' }} />
          </div>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px'
          }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>API Health</Text>
                <Text style={{ fontSize: '12px', color: '#2ed573' }}>98%</Text>
              </div>
              <Progress 
                percent={98} 
                size="small" 
                strokeColor="#2ed573"
                showInfo={false}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Database</Text>
                <Text style={{ fontSize: '12px', color: '#2ed573' }}>100%</Text>
              </div>
              <Progress 
                percent={100} 
                size="small" 
                strokeColor="#2ed573"
                showInfo={false}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>WebSocket</Text>
                <Text style={{ fontSize: '12px', color: '#ff8c00' }}>Connecting...</Text>
              </div>
              <Progress 
                percent={75} 
                size="small" 
                strokeColor="#ff8c00"
                showInfo={false}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
            </Space>
          </div>
        </Space>
      </div>

      <Divider style={{ 
        margin: '16px 0', 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        opacity: 0.5 
      }} />

      {/* Main Navigation Menu */}
      <div style={{ flex: 1 }}>
        <Menu
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          defaultOpenKeys={['delegates', 'analytics']}
          items={menuItems}
          style={{ 
            background: 'transparent',
            border: 'none'
          }}
          theme="dark"
        />
      </div>

      <Divider style={{ 
        margin: '16px 0', 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        opacity: 0.5 
      }} />

      {/* Alerts Section */}
      <div style={{ marginTop: 'auto' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOutlined style={{ color: '#ff4757', fontSize: '14px' }} />
            <Text strong style={{ fontSize: '14px', color: '#e0e0e0' }}>
              Active Alerts
            </Text>
          </div>
          
          <div style={{ 
            background: 'rgba(255, 71, 87, 0.1)', 
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid rgba(255, 71, 87, 0.3)'
          }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: '12px', color: '#ff8c00' }}>Token Usage High</Text>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%',
                  background: '#ff8c00',
                  animation: 'pulse-glow 2s infinite'
                }} />
              </div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Monitor delegate #3 token consumption
              </Text>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <Text style={{ fontSize: '12px', color: '#1890ff' }}>Cost Threshold</Text>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%',
                  background: '#1890ff'
                }} />
              </div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Approaching $500 monthly limit
              </Text>
            </Space>
          </div>
        </Space>
      </div>
    </div>
  );
};

export default Sidebar;