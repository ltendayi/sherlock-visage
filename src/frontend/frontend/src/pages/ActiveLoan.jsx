/**
 * VoltLedger Active Loan Page
 * Active loan tracking with GPS display
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Layout, 
  Card, 
  Button, 
  Typography, 
  Space,
  Badge,
  Statistic,
  Alert,
  Timeline,
  List,
  Tag,
  Skeleton,
  Empty,
  Modal,
  Form,
  Input,
  message
} from 'antd'
import {
  BikeOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  PhoneOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import useLoanStore from '../store/loanStore'
import { formatDate, formatDateTime, getStatusColor } from '../utils/helpers'
import { formatCurrency, calculateDays } from '../utils/validators'

const { Content } = Layout
const { Title, Text } = Typography
const { Countdown } = Statistic
const { confirm } = Modal

const ActiveLoan = () => {
  const navigate = useNavigate()
  const { 
    activeLoan, 
    isLoading, 
    error,
    fetchActiveLoan, 
    extendLoan, 
    returnBike,
    reportIssue 
  } = useLoanStore()

  const [extendModalVisible, setExtendModalVisible] = useState(false)
  const [returnModalVisible, setReturnModalVisible] = useState(false)
  const [issueModalVisible, setIssueModalVisible] = useState(false)
  const [extendDays, setExtendDays] = useState(1)

  useEffect(() => {
    fetchActiveLoan()
  }, [])

  const handleExtend = async () => {
    if (!activeLoan) return
    
    const newEndDate = dayjs(activeLoan.end_date).add(extendDays, 'day')
    
    const result = await extendLoan(activeLoan.loan_id, {
      newEndDate: newEndDate.format('YYYY-MM-DD'),
      extensionDays: extendDays,
    })

    if (result.success) {
      message.success('Loan extended successfully')
      setExtendModalVisible(false)
      fetchActiveLoan()
    } else {
      message.error(result.error || 'Failed to extend loan')
    }
  }

  const handleReturn = async () => {
    if (!activeLoan) return
    
    confirm({
      title: 'Confirm Bike Return',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to return this bike?',
      onOk: async () => {
        const result = await returnBike(activeLoan.loan_id, {
          returnLocationId: activeLoan.pickup_location_id,
          conditionNotes: '',
          damageReported: false,
          finalBatteryPct: activeLoan.bike?.current_battery_pct || 0,
        })

        if (result.success) {
          message.success('Bike returned successfully!')
          setReturnModalVisible(false)
          setTimeout(() => navigate('/dashboard'), 1500)
        } else {
          message.error(result.error || 'Failed to return bike')
        }
      },
    })
  }

  const handleReportIssue = async (values) => {
    if (!activeLoan) return
    
    const result = await reportIssue(activeLoan.loan_id, {
      issueType: values.issueType,
      description: values.description,
      severity: values.severity || 'medium',
    })

    if (result.success) {
      message.success('Issue reported successfully')
      setIssueModalVisible(false)
    } else {
      message.error(result.error || 'Failed to report issue')
    }
  }

  const getRemainingTime = () => {
    if (!activeLoan?.end_date) return null
    return dayjs(activeLoan.end_date).valueOf()
  }

  const isOverdue = () => {
    if (!activeLoan?.end_date) return false
    return dayjs().isAfter(dayjs(activeLoan.end_date))
  }

  const loanDuration = () => {
    if (!activeLoan?.start_date || !activeLoan?.end_date) return 0
    return calculateDays(activeLoan.start_date, activeLoan.end_date)
  }

  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '16px' }}>
          <Skeleton active />
        </Content>
      </Layout>
    )
  }

  if (!activeLoan) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/dashboard')}
            style={{ marginBottom: 16 }}
          >
            Back
          </Button>
          
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No active loan"
          >
            <Button type="primary" onClick={() => navigate('/bikes')}>
              Book a Bike
            </Button>
          </Empty>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '16px', maxWidth: 800, margin: '0 auto' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: 16 }}
        >
          Back
        </Button>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Status Header */}
          <Card style={{ 
            background: isOverdue() ? '#fff2f0' : '#f6ffed',
            borderColor: isOverdue() ? '#ffccc7' : '#b7eb8f'
          }}>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <BikeOutlined style={{ 
                  fontSize: 32, 
                  color: isOverdue() ? '#f5222d' : '#52c41a' 
                }} />
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {isOverdue() ? 'OVERDUE' : 'ACTIVE'}
                  </Text>
                  <br />
                  <Tag color={isOverdue() ? 'error' : 'success'}>
                    {activeLoan.bike?.model || 'E-Bike'}
                  </Tag>
                </div>
              </Space>
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isOverdue() ? 'Overdue by' : 'Time Remaining'}
                </Text>
                <br />
                <Text strong style={{ 
                  fontSize: 20, 
                  color: isOverdue() ? '#f5222d' : '#52c41a' 
                }}>
                  {isOverdue() ? (
                    `${Math.abs(dayjs().diff(dayjs(activeLoan.end_date), 'hours'))}h`
                  ) : (
                    <Countdown 
                      value={getRemainingTime()} 
                      format="HH:mm:ss"
                    />
                  )}
                </Text>
              </div>
            </Space>
          </Card>

          {/* Bike Details */}
          <Card title="Bike Details">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">Serial Number:</Text>
                <Text strong>{activeLoan.bike?.serial_number || 'N/A'}</Text>
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">Model:</Text>
                <Text>{activeLoan.bike?.model || 'E-Bike'}</Text>
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">Battery:</Text>
                <Space>
                  <ThunderboltOutlined 
                    style={{ 
                      color: (activeLoan.bike?.current_battery_pct || 0) > 50 ? '#52c41a' : '#faad14'
                    }} 
                  />
                  <Text>{activeLoan.bike?.current_battery_pct || 0}%</Text>
                </Space>
              </Space>
            </Space>
          </Card>

          {/* Loan Timeline */}
          <Card title="Loan Timeline">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>Pickup</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(activeLoan.start_date)}
                      </Text>
                    </div>
                  ),
                },
                {
                  color: isOverdue() ? 'red' : 'blue',
                  children: (
                    <div>
                      <Text strong>Due Return</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(activeLoan.end_date)}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Duration: {loanDuration()} days
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          {/* Location */}
          <Card title="Pickup Location">
            <Space>
              <EnvironmentOutlined />
              <Text>{activeLoan.pickup_location?.name || 'N/A'}</Text>
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activeLoan.pickup_location?.address}
            </Text>
          </Card>

          {/* Cost Summary */}
          <Card title="Cost Summary">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">Daily Rate:</Text>
                <Text>{formatCurrency(activeLoan.daily_rate || 0)}</Text>
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">Days:</Text>
                <Text>{loanDuration()}</Text>
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary">Deposit:</Text>
                <Text>{formatCurrency(activeLoan.deposit_amt || 0)}</Text>
              </Space>
              {isOverdue() && (
                <>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text type="danger">Late Fee:</Text>
                    <Text type="danger">
                      {formatCurrency((activeLoan.late_fee || 0))}
                    </Text>
                  </Space>
                  <Alert 
                    message="Late return charges apply" 
                    type="warning" 
                    showIcon
                  />
                </>
              )}
            </Space>
          </Card>

          {/* Actions */}
          <Space direction="vertical" style={{ width: '100%' }}>
            {!isOverdue() && (
              <Button
                icon={<PlusOutlined />}
                size="large"
                block
                onClick={() => setExtendModalVisible(true)}
              >
                Extend Loan
              </Button>
            )}
            
            <Button
              icon={<CheckCircleOutlined />}
              type="primary"
              size="large"
              block
              onClick={handleReturn}
            >
              Return Bike
            </Button>
            
            <Button
              icon={<WarningOutlined />}
              danger
              size="large"
              block
              onClick={() => setIssueModalVisible(true)}
            >
              Report Issue
            </Button>

            <Button
              icon={<PhoneOutlined />}
              size="large"
              block
              href="tel:+254700000000"
            >
              Emergency Contact
            </Button>
          </Space>
        </Space>

        {/* Extend Modal */}
        <Modal
          title="Extend Loan"
          open={extendModalVisible}
          onCancel={() => setExtendModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setExtendModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="extend" 
              type="primary" 
              onClick={handleExtend}
            >
              Extend
            </Button>,
          ]}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Select additional days:</Text>
            <Input
              type="number"
              min={1}
              max={7}
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
              suffix="days"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Additional cost: {formatCurrency((activeLoan?.daily_rate || 0) * extendDays)}
            </Text>
          </Space>
        </Modal>

        {/* Issue Report Modal */}
        <Modal
          title="Report an Issue"
          open={issueModalVisible}
          onCancel={() => setIssueModalVisible(false)}
          footer={null}
        >
          <Form onFinish={handleReportIssue} layout="vertical">
            <Form.Item
              name="issueType"
              label="Issue Type"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g., Flat tire, Battery issue" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true }]}
            >
              <Input.TextArea rows={4} placeholder="Describe the issue in detail" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Submit Report
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}

export default ActiveLoan
