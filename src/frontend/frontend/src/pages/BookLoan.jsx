/**
 * VoltLedger Book Loan Page
 * Loan booking flow with date selection and payment
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Layout, 
  Card, 
  Steps,
  DatePicker,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
  List,
  Checkbox,
  Skeleton,
  message
} from 'antd'
import {
  CalendarOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import useBikeStore from '../store/bikeStore'
import useLoanStore from '../store/loanStore'
import usePaymentStore from '../store/paymentStore'
import { formatCurrency, calculateLoanTotal, validateDateRange } from '../utils/validators'
import { formatDate } from '../utils/helpers'

const { Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker

const BookLoan = () => {
  const navigate = useNavigate()
  const { selectedBike } = useBikeStore()
  const { bookLoan, isLoading: loanLoading } = useLoanStore()
  const { initiateMpesaPayment, paymentStatus, clearPayment } = usePaymentStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [dateRange, setDateRange] = useState(null)
  const [dateError, setDateError] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    if (!selectedBike) {
      navigate('/bikes')
    }
    return () => {
      clearPayment()
    }
  }, [])

  const calculateCost = () => {
    if (!dateRange) return null
    const days = dateRange[1].diff(dateRange[0], 'day') + 1
    return calculateLoanTotal(selectedBike?.daily_rate_kes || 500, days, selectedBike?.deposit_amount_kes || 2000)
  }

  const handleDateChange = (dates) => {
    setDateRange(dates)
    setDateError(null)
    
    if (dates) {
      const validation = validateDateRange(dates[0].toDate(), dates[1].toDate())
      if (!validation.valid) {
        setDateError(validation.message)
      }
    }
  }

  const handleDateConfirm = () => {
    if (!dateRange) {
      message.error('Please select pickup and return dates')
      return
    }
    
    if (dateError) {
      message.error(dateError)
      return
    }

    setCurrentStep(1)
  }

  const handleTermsConfirm = () => {
    if (!termsAccepted) {
      message.error('Please accept the terms and conditions')
      return
    }
    setCurrentStep(2)
  }

  const handlePayment = async () => {
    if (!phoneNumber) {
      message.error('Please enter your M-Pesa phone number')
      return
    }

    const cost = calculateCost()
    
    try {
      // First create the loan
      const loanResult = await bookLoan({
        bikeId: selectedBike.bike_id,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        pickupLocationId: selectedBike.location_id,
      })

      if (!loanResult.success) {
        message.error(loanResult.error || 'Failed to create booking')
        return
      }

      // Then initiate payment
      const paymentResult = await initiateMpesaPayment({
        loanId: loanResult.data.loan_id,
        phoneNumber: phoneNumber,
        amount: cost.total,
        description: `VoltLedger Bike Rental - ${selectedBike.model || 'E-Bike'}`,
      })

      if (paymentResult.success) {
        message.success('M-Pesa payment request sent to your phone')
        setBookingData({
          loan: loanResult.data,
          payment: paymentResult.data,
          cost,
        })
        setCurrentStep(3)
      } else {
        message.error(paymentResult.error || 'Payment initiation failed')
      }
    } catch (error) {
      message.error('An error occurred. Please try again.')
    }
  }

  const steps = [
    {
      title: 'Dates',
      icon: <CalendarOutlined />,
    },
    {
      title: 'Terms',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Payment',
      icon: <CreditCardOutlined />,
    },
  ]

  const cost = calculateCost()

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/bikes')}
          style={{ marginBottom: 16 }}
        >
          Back to Bikes
        </Button>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        {!selectedBike ? (
          <Skeleton active />
        ) : (
          <Card>
            {/* Bike Summary */}
            <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 24 }}>
              <Title level={5}>{selectedBike.model || 'E-Bike'}</Title>
              <Text type="secondary">
                Daily Rate: {formatCurrency(selectedBike.daily_rate_kes)}
              </Text>
              <Text type="secondary">
                Deposit: {formatCurrency(selectedBike.deposit_amount_kes)}
              </Text>
            </Space>

            <Divider />

            {/* Step 1: Date Selection */}
            {currentStep === 0 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>Select Rental Period</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Maximum rental period is 14 days
                  </Text>
                </div>

                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={disabledDate}
                  onChange={handleDateChange}
                  format="DD/MM/YYYY"
                  placeholder={['Pickup Date', 'Return Date']}
                />

                {dateError && (
                  <Alert message={dateError} type="error" showIcon />
                )}

                {cost && (
                  <Card size="small" style={{ background: '#f6ffed' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text>Rental ({cost.days} days):</Text>
                        <Text>{formatCurrency(cost.dailyTotal)}</Text>
                      </Space>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text>Deposit:</Text>
                        <Text>{formatCurrency(cost.deposit)}</Text>
                      </Space>
                      <Divider style={{ margin: '8px 0' }} />
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text strong>Total:</Text>
                        <Text strong style={{ color: '#1890ff', fontSize: 18 }}>
                          {formatCurrency(cost.total)}
                        </Text>
                      </Space>
                    </Space>
                  </Card>
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleDateConfirm}
                  disabled={!dateRange || dateError}
                >
                  Continue
                </Button>
              </Space>
            )}

            {/* Step 2: Terms */}
            {currentStep === 1 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>Rental Terms & Conditions</Text>
                </div>

                <Card size="small" style={{ maxHeight: 300, overflow: 'auto' }}>
                  <List
                    size="small"
                    dataSource={[
                      'Bike must be returned in the same condition as received',
                      'Late returns will incur additional daily charges',
                      'Damage caused by negligence is the renter\'s financial responsibility',
                      'Helmet must be worn at all times during use',
                      'Bike is for personal use only - no commercial activities',
                      'Renter is responsible for securing the bike when not in use',
                      'In case of theft, a police report must be filed immediately',
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Text style={{ fontSize: 12 }}>{item}</Text>
                      </List.Item>
                    )}
                  />
                </Card>

                <Checkbox 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                >
                  I accept the terms and conditions
                </Checkbox>

                <Space style={{ width: '100%' }}>
                  <Button onClick={() => setCurrentStep(0)} style={{ flex: 1 }}>
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleTermsConfirm}
                    disabled={!termsAccepted}
                    style={{ flex: 1 }}
                  >
                    Continue
                  </Button>
                </Space>
              </Space>
            )}

            {/* Step 3: Payment */}
            {currentStep === 2 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>M-Pesa Payment</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    You will receive an STK push on your phone
                  </Text>
                </div>

                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text>Amount to Pay:</Text>
                      <Text strong style={{ color: '#1890ff', fontSize: 20 }}>
                        {formatCurrency(cost?.total || 0)}
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <InfoCircleOutlined /> Includes {formatCurrency(cost?.deposit || 0)} refundable deposit
                    </Text>
                  </Space>
                </Card>

                <div>
                  <Text>Enter M-Pesa Number:</Text>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '6px',
                      border: '1px solid #d9d9d9',
                      marginTop: '8px',
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Format: 2547XXXXXXXX
                  </Text>
                </div>

                <Space style={{ width: '100%' }}>
                  <Button onClick={() => setCurrentStep(1)} style={{ flex: 1 }}>
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={handlePayment}
                    loading={loanLoading}
                    disabled={!phoneNumber}
                    style={{ flex: 1 }}
                  >
                    Pay with M-Pesa
                  </Button>
                </Space>
              </Space>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 3 && (
              <Space direction="vertical" size="large" style={{ width: '100%' }} align="center">
                <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
                <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
                  Booking Confirmed!
                </Title>
                <Text style={{ textAlign: 'center' }}>
                  Your M-Pesa payment request has been sent.
                </Text>
                
                <Card size="small" style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text type="secondary">Pickup:</Text>
                      <Text strong>{formatDate(dateRange?.[0])}</Text>
                    </Space>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text type="secondary">Return:</Text>
                      <Text strong>{formatDate(dateRange?.[1])}</Text>
                    </Space>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text type="secondary">Total:</Text>
                      <Text strong>{formatCurrency(cost?.total || 0)}</Text>
                    </Space>
                  </Space>
                </Card>

                <Button
                  type="primary"
                  onClick={() => navigate('/dashboard')}
                  block
                  size="large"
                >
                  Go to Dashboard
                </Button>
              </Space>
            )}
          </Card>
        )}
      </Content>
    </Layout>
  )
}

export default BookLoan
