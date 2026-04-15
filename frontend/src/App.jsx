import React from 'react';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { PieChartOutlined, MessageOutlined, CalendarOutlined, CreditCardOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import CalendarPage from './pages/Calendar';
import Wallet from './pages/Wallet';

const { Header, Content, Sider } = Layout;

const getItem = (label, key, icon) => ({
  key,
  icon,
  label: <Link to={key} style={{color: 'white'}}>{label}</Link>,
});

function AppContent() {
  const location = useLocation();
  const items = [
    getItem('Dashboard', '/dashboard', <PieChartOutlined />),
    getItem('Chat', '/chat', <MessageOutlined />),
    getItem('Calendar', '/calendar', <CalendarOutlined />),
    getItem('Wallet', '/wallet', <CreditCardOutlined />),
  ];
  const selectedKey = [location.pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu theme="dark" mode="inline" selectedKeys={selectedKey} items={items} />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }} />
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return <Router><AppContent /></Router>;
}

export default App;
