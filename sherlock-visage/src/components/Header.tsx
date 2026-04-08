import React from 'react';
import { Space, Typography, Avatar, Badge, Dropdown, MenuProps, Button } from 'antd';
import { 
  BellOutlined, 
  UserOutlined, 
  SettingOutlined,
  SyncOutlined,
  CloudSyncOutlined 
} from '@ant-design/icons';
import { format } from 'date-fns';

const { Text } = Typography;

/**
 * Header component for Sherlock Visage Dashboard
 * Standardized communication header with real-time status indicators
 */
const Header: React.FC = () => {
  const currentTime = format(new Date(), 'HH:mm:ss');
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile Settings',
      icon: <UserOutlined />
    },
    {
      key: 'preferences',
      label: 'Dashboard Preferences',
      icon: <SettingOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Logout',
      danger: true
    }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      height: '64px'
    }}>
      {/* Left: Logo & Title */}
      <Space align="center" size="large">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00ff88 0%, #9d4edd 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <Text strong style={{ fontSize: '16px', color: '#e0e0e0' }}>
              Sherlock Visage
            </Text>
            <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
              Nairobi HQ Operations Center
            </div>
          </div>
        </div>
      </Space>

      {/* Center: Time & Status */}
      <Space direction="vertical" align="center" size={0}>
        <Space size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudSyncOutlined style={{ color: '#00ff88', fontSize: '16px' }} />
            <Text type="success" style={{ fontSize: '12px' }}>
              Systems: Online
            </Text>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SyncOutlined spin style={{ color: '#1890ff', fontSize: '16px' }} />
            <Text style={{ fontSize: '12px', color: '#a0a0a0' }}>
              Real-time Updates
            </Text>
          </div>
        </Space>
        <Text style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: 500 }}>
          {currentDate} • {currentTime}
        </Text>
      </Space>

      {/* Right: User & Controls */}
      <Space size="large" align="center">
        <Button 
          type="text" 
          icon={<SyncOutlined />}
          style={{ color: '#a0a0a0' }}
        >
          Refresh Data
        </Button>
        
        <Badge count={3} size="small" style={{ backgroundColor: '#ff4757' }}>
          <BellOutlined style={{ 
            fontSize: '20px', 
            color: '#a0a0a0',
            cursor: 'pointer',
            padding: '8px'
          }} />
        </Badge>
        
        <Dropdown menu={{ items }} trigger={['click']}>
          <Space style={{ cursor: 'pointer', padding: '8px' }}>
            <Avatar 
              size="default" 
              style={{ 
                background: 'linear-gradient(135deg, #00ff88 0%, #9d4edd 100%)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
              icon={<UserOutlined />}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text style={{ fontSize: '14px', color: '#e0e0e0' }}>
                Operator
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Admin Access
              </Text>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </div>
  );
};

export default Header;