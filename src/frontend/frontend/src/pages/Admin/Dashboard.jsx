/**
 * VoltLedger Admin Dashboard
 * Admin panel overview with key metrics
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic,
  Table,
  Tag,
  Badge,
  Space,
  Button,
  Alert
} from 'antd'
import {
  UserOutlined,
  BikeOutlined,
  DollarOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/validators'
import { formatDate, getStatusColor } from '../../utils/helpers'

const { Content } = Layout
const { Title, Text } = Typography

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLoans: 0,
    totalRevenue: 0,
    overdueLoans: 0,
  })

  // Mock data - would be fetched from API
  const recentLoans = [
    {
      loan_id: '1',
      user: { full_name: 'John Kamau', phone_number: '254712345678' },
      bike: { model: 'Volt X1', serial_number: 'VL001' },
      status: 'active',
      start_date: '2026-04-01',
      end_date: '2026-04-05',
      total_paid: 2500,
    },
    {
      loan_id: '2',
      user: { full_name: 'Jane Wanjiku', phone_number: '254723456789' },
      bike: { model: 'Volt Pro', serial_number: 'VL015' },
      status: 'overdue',
      start_date: '2026-03-28',
      end_date: '2026-03-30',
      total_paid: 1500,
    },
  ]

  const loanColumns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space direction="vertical" size={0}>
          <Text strong>{user?.full_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{user?.phone_number}</Text>
        </Space>
      ),
    },
    {
      title: 'Bike',
      dataIndex: 'bike',
      key: 'bike',
      render: (bike) => (
        <Space direction="vertical" size={0}>
          <Text>{bike?.model}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{bike?.serial_number}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Amount',
      dataIndex: 'total_paid',
      key: 'total_paid',
      render: (amount) => formatCurrency(amount),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/admin/loans/${record.loan_id}`)}>
          View
        </Button>
      ),
    },
  ]

  if (user?.role !== 'admin' && user?.role !== 'agent') {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: 24 }}>
          <Alert
            message="Access Denied"
            description="You do not have permission to view this page."
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
              <Text type="secondary">Overview of system performance</Text>
            </div>
            <Button icon={<ReloadOutlined />} onClick={() => {}}>
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Users"
                  value={stats.totalUsers || 156}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Active Loans"
                  value={stats.activeLoans || 23}
                  prefix={<BikeOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Today's Revenue"
                  value={formatCurrency(stats.totalRevenue || 12500)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Overdue Loans"
                  value={stats.overdueLoans || 3}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Recent Loans Table */}
          <Card
            title="Recent Loans"
            extra={
              <Space>
                <Button onClick={() => navigate('/admin/loans')}>
                  View All Loans
                </Button>
                <Button type="primary" onClick={() => navigate('/admin/overdue')} danger>
                  View Overdue
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={recentLoans}
              columns={loanColumns}
              rowKey="loan_id"
              pagination={false}
              size="small"
            />
          </Card>

          {/* Quick Links */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card hoverable onClick={() => navigate('/admin/bikes')}>
                <Space>
                  <BikeOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div>
                    <Text strong>Bike Management</Text>
                    <br />
                    <Text type="secondary">Manage inventory and maintenance</Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card hoverable onClick={() => navigate('/admin/users')}>
                <Space>
                  <UserOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                  <div>
                    <Text strong>User Management</Text>
                    <br />
                    <Text type="secondary">View and manage users</Text>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card hoverable onClick={() => navigate('/admin/reports')}>
                <Space>
                  <DollarOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                  <div>
                    <Text strong>Reports</Text>
                    <br />
                    <Text type="secondary">View analytics and reports</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </Content>
    </Layout>
  )
}

export default AdminDashboard
