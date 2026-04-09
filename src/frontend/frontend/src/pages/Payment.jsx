/**
 * VoltLedger Payment Page
 * Payment initiation and status tracking (M-Pesa/Paystack)
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Layout, 
  Card, 
  Button, 
  Typography, 
  Space,
  Steps,
  Result,
  Spin,
  Alert,
  Input,
  Radio,
  Divider,
  Badge,
  message
} from 'antd'
import {
  CreditCardOutlined,
  MobileOutlined,
  MoneyCollectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import usePaymentStore from '../store/paymentStore'
import { formatCurrency, formatKenyanPhone } from '../utils/validators'

const { Content } = Layout
const { Title, Text } = Typography

const Payment = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loanId = searchParams.get('loan_id')
  const amount = parseInt(searchParams.get('amount') || '0')
  const reference = searchParams.get('reference')

  const {
    pendingPayment,
    paymentStatus,
    isLoading,
    error,
    initiateMpesaPayment,
    checkPaymentStatus,
    initiatePaystackPayment,
    verifyPaystackPayment,
    retryPayment,
    clearPayment
  } = usePaymentStore()

  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // If we have a reference from Paystack callback, verify it
    if (reference) {
      verifyPaystackPayment(reference)
      setCurrentStep(2)
    }
    
    return () => {
      clearPayment()
    }
  }, [reference])

  const handleMpesaPayment = async () => {
    const formattedPhone = formatKenyanPhone(phoneNumber)
    
    if (!formattedPhone || formattedPhone.length !== 12) {
      message.error('Please enter a valid Kenyan phone number')
      return
    }

    const result = await initiateMpesaPayment({
      loanId,
      phoneNumber: formattedPhone,
      amount,
      description: 'VoltLedger Payment',
    })

    if (result.success) {
      setCurrentStep(1)
    } else {
      message.error(result.error || 'Failed to initiate payment')
    }
  }

  const handlePaystackPayment = async () => {
    if (!email || !email.includes('@')) {
      message.error('Please enter a valid email address')
      return
    }

    const result = await initiatePaystackPayment({
      loanId,
      email,
      amount,
      callbackUrl: `${window.location.origin}/payment?loan_id=${loanId}`,
    })

    if (result.success && result.data.authorization_url) {
      // Redirect to Paystack checkout
      window.location.href = result.data.authorization_url
    } else {
      message.error(result.error || 'Failed to initiate payment')
    }
  }

  const handleRetry = async () => {
    if (pendingPayment?.payment_id) {
      await retryPayment(pendingPayment.payment_id)
    }
  }

  const steps = [
    {
      title: 'Select',
      icon: <CreditCardOutlined />,
    },
    {
      title: 'Process',
      icon: isLoading ? <LoadingOutlined /> : <MobileOutlined />,
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
    },
  ]

  const renderPaymentMethodSelection = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Radio.Group 
        value={paymentMethod} 
        onChange={(e) => setPaymentMethod(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card 
            style={{ 
              borderColor: paymentMethod === 'mpesa' ? '#1890ff' : '#d9d9d9',
              cursor: 'pointer'
            }}
            onClick={() => setPaymentMethod('mpesa')}
          >
            <Radio value="mpesa">
              <Space>
                <MobileOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div>
                  <Text strong>M-Pesa</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    STK Push to your phone
                  </Text>
                </div>
              </Space>
            </Radio>
          </Card>

          <Card 
            style={{ 
              borderColor: paymentMethod === 'paystack' ? '#1890ff' : '#d9d9d9',
              cursor: 'pointer'
            }}
            onClick={() => setPaymentMethod('paystack')}
          >
            <Radio value="paystack">
              <Space>
                <CreditCardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div>
                  <Text strong>Card / Bank</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Pay with card or bank transfer
                  </Text>
                </div>
              </Space>
            </Radio>
          </Card>
        </Space>
      </Radio.Group>

      <Divider />

      {paymentMethod === 'mpesa' ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Enter M-Pesa Phone Number:</Text>
          <Input
            size="large"
            placeholder="07XX XXX XXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            prefix={<MobileOutlined />}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Format: 07XX XXX XXX
          </Text>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleMpesaPayment}
            loading={isLoading}
          >
            Pay {formatCurrency(amount)} with M-Pesa
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Enter Email Address:</Text>
          <Input
            size="large"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefix={<CreditCardOutlined />}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handlePaystackPayment}
            loading={isLoading}
          >
            Pay {formatCurrency(amount)} with Card
          </Button>
        </Space>
      )}
    </Space>
  )

  const renderProcessingStatus = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }} align="center">
      <Spin size="large" />
      <Title level={4}>Processing Payment</Title>
      <Text>
        {paymentMethod === 'mpesa' 
          ? 'Check your phone for the M-Pesa STK push'
          : 'Redirecting to payment gateway...'
        }
      </Text>
      
      {pendingPayment && (
        <Card size="small" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text type="secondary">M-Pesa Reference:</Text>
              <Text copyable>{pendingPayment.checkout_request_id}</Text>
            </Space>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text type="secondary">Amount:</Text>
              <Text strong>{formatCurrency(amount)}</Text>
            </Space>
          </Space>
        </Card>
      )}

      <Button 
        icon={<ReloadOutlined />} 
        onClick={handleRetry}
        loading={isLoading}
      >
        Retry Payment
      </Button>
    </Space>
  )

  const renderResult = () => {
    if (paymentStatus === 'completed' || (reference && !error)) {
      return (
        <Result
          status="success"
          title="Payment Successful!"
          subTitle="Your transaction has been completed successfully."
          extra={[
            <Button 
              type="primary" 
              key="dashboard"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>,
            <Button 
              key="receipt"
              onClick={() => navigate('/history')}
            >
              View Receipt
            </Button>,
          ]}
        />
      )
    }

    return (
      <Result
        status="error"
        title="Payment Failed"
        subTitle={error || 'There was an error processing your payment.'}
        extra={[
          <Button 
            type="primary" 
            key="retry"
            onClick={() => setCurrentStep(0)}
          >
            Try Again
          </Button>,
          <Button 
            key="support"
            onClick={() => navigate('/support')}
          >
            Contact Support
          </Button>,
        ]}
      />
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Back
        </Button>

        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        <Card>
          {currentStep === 0 && renderPaymentMethodSelection()}
          {currentStep === 1 && renderProcessingStatus()}
          {currentStep === 2 && renderResult()}
        </Card>
      </Content>
    </Layout>
  )
}

export default Payment
