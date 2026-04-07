import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import { DashboardOutlined, TruckOutlined, InboxOutlined, CalendarOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ color: 'white', padding: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          Logistics Dashboard
        </div>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            Overview
          </Menu.Item>
          <Menu.Item key="2" icon={<TruckOutlined />}>
            Shipment Tracking
          </Menu.Item>
          <Menu.Item key="3" icon={<InboxOutlined />}>
            Inventory Management
          </Menu.Item>
          <Menu.Item key="4" icon={<CalendarOutlined />}>
            Delivery Schedule
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          </Breadcrumb>
        </Header>
        <Content style={{ margin: '16px' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};