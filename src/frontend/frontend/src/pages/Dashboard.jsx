/**
 * VoltLedger Dashboard Page
 * User dashboard with active loan overview, payment history, upcoming bookings
 */

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space,
  Badge,
  Statistic,
  List,
  Avatar,
  Skeleton,
  Tag,
  Empty
} from 'antd'
import {
  BikeOutlined,
  WalletOutlined,
  HistoryOutlined,
  RightOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import useLoanStore from '../store/loanStore'
import { formatDate, formatRelativeTime } from '../utils/helpers'
import { formatCurrency } from '../utils/validators'
import { getStatusColor } from '../utils/helpers'

const { Content } = Layout
const { Title, Text } = Typography

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    activeLoan, 
    loans, 
    isLoading, 
    fetchActiveLoan, 
    fetchMyLoans 
  } = useLoanStore()

  useEffect(() => {
    fetchActiveLoan()
    fetchMyLoans({ limit: 5 })
  }, [])

  const stats = [
    {
      title: 'Active Loans',
      value: activeLoan ? 1 : 0,
      icon: <BikeOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(loans?.reduce((sum, loan) => sum + (loan.total_paid || 0), 0) || 0),
      icon: <WalletOutlined />,
      color: '#52c41a',
    },
    {
      title: 'History',
      value: loans?.length || 0,
      icon: <HistoryOutlined />,
      color: '#722ed1',
    },
  ]

  const quickActions = [
    {
      title: 'Book a Bike',
      description: 'Find available bikes near you',
      icon: <BikeOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      onClick: () => navigate('/bikes'),
    },
    {
      title: 'Active Loan',
      description: activeLoan ? 'View your current ride' : 'No active loan',
      icon: activeLoan 
        ? <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
        : <WarningOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      onClick: () => activeLoan && navigate('/active-loan'),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Welcome Section */}
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Welcome back, {user?.full_name?.split(' ')[0] || 'Rider'}!
            </Title>
            <Text type="secondary">
              {user?.id_verified 
                ? 'Verified Account' 
                : 'Complete KYC to unlock all features'}
            </Text>
          </div>

          {/* Stats */}
          <Row gutter={[16, 16]}>
            {stats.map((stat, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    valueStyle={{ color: stat.color }}
                    prefix={stat.icon}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Active Loan Alert */}
          {activeLoan && (
            <Card 
              style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
              onClick={() => navigate('/active-loan')}
              hoverable
            >
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Avatar 
                    size={48} 
                    icon={<BikeOutlined />} 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                  <div>
                    <Text strong>Active Loan</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined /> Due {formatDate(activeLoan.end_date)}
                    </Text>
                  </div>
                </Space>
                <RightOutlined />
              </Space>
            </Card>
          )}

          {/* Quick Actions */}
          <Title level={5}>Quick Actions</Title>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} key={index}>
                <Card hoverable onClick={action.onClick}>
                  <Space align="start">
                    {action.icon}
                    <div>
                      <Text strong>{action.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {action.description}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Recent Loans */}
          <Card
            title="Recent Loans"
            extra={
              <Button type="link" onClick={() => navigate('/history')}>
                View All
              </Button>
            }
          >
            {isLoading ? (
              <Skeleton active />
            ) : loans?.length > 0 ? (
              <List
                dataSource={loans.slice(0, 5)}
                renderItem={(loan) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        onClick={() => navigate(`/loans/${loan.loan_id}`)}
                      >
                        View
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<BikeOutlined />} 
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>Bike #{loan.bike?.serial_number?.slice(-4) || '...'}</Text>
                          <Tag color={getStatusColor(loan.status)}>
                            {loan.status?.toUpperCase()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <EnvironmentOutlined /> {loan.pickup_location?.name || 'N/A'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDate(loan.start_date)} - {formatDate(loan.end_date)}
                          </Text>
                        </Space>
                      }
                    />
                    <div>
                      <Text strong>{formatCurrency(loan.total_paid || 0)}</Text>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No loan history yet"
              >
                <Button type="primary" onClick={() => navigate('/bikes')}>
                  Book Your First Bike
                </Button>
              </Empty>
            )}
          </Card>
        </Space>
      </Content>
    </Layout>
  )
}

export default Dashboard
