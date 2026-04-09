/**
 * VoltLedger Login Page
 * Phone + OTP login (Kenyan format 2547XXXXXXXX)
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Alert,
  Steps,
  message
} from 'antd'
import { 
  PhoneOutlined, 
  SafetyOutlined, 
  LoginOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { formatKenyanPhone, validateKenyanPhone } from '../utils/validators'

const { Title, Text } = Typography

const Login = () => {
  const navigate = useNavigate()
  const { 
    isLoading, 
    error, 
    otpSent, 
    phoneNumber, 
    setPhoneNumber, 
    requestOTP, 
    verifyOTP, 
    clearError,
    resetOTP
  } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [otp, setOtp] = useState('')

  const handlePhoneSubmit = async (values) => {
    const formattedPhone = formatKenyanPhone(values.phone)
    
    if (!validateKenyanPhone(formattedPhone)) {
      message.error('Please enter a valid Kenyan phone number (07XX XXX XXX)')
      return
    }

    const result = await requestOTP(formattedPhone)
    if (result.success) {
      message.success('OTP sent to your phone!')
      setCurrentStep(1)
    } else {
      message.error(result.error || 'Failed to send OTP')
    }
  }

  const handleOTPSubmit = async () => {
    if (otp.length !== 6) {
      message.error('Please enter the 6-digit OTP')
      return
    }

    const result = await verifyOTP(otp)
    if (result.success) {
      message.success('Login successful!')
      
      // Check if user needs to complete profile
      const { user } = result.data
      if (!user.full_name || !user.id_verified) {
        navigate('/register')
      } else {
        navigate('/dashboard')
      }
    } else {
      message.error(result.error || 'Invalid OTP')
    }
  }

  const handleBack = () => {
    resetOTP()
    setOtp('')
    setCurrentStep(0)
    clearError()
  }

  const steps = [
    {
      title: 'Phone',
      icon: <PhoneOutlined />,
    },
    {
      title: 'Verify',
      icon: <SafetyOutlined />,
    },
  ]

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '16px',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              VoltLedger
            </Title>
            <Text type="secondary">E-Bike Lending Platform</Text>
          </div>

          <Steps current={currentStep} items={steps} />

          {error && (
            <Alert 
              message={error} 
              type="error" 
              closable 
              onClose={clearError}
            />
          )}

          {currentStep === 0 ? (
            <Form
              name="phone-login"
              onFinish={handlePhoneSubmit}
              layout="vertical"
            >
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter your phone number' },
                ]}
                extra="Format: 07XX XXX XXX"
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="07XX XXX XXX"
                  size="large"
                  maxLength={13}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={isLoading}
                  icon={<LoginOutlined />}
                >
                  Send OTP
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Text>Enter the 6-digit code sent to</Text>
                <br />
                <Text strong>{phoneNumber}</Text>
              </div>

              <Input.OTP
                length={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                size="large"
                style={{ justifyContent: 'center' }}
              />

              <Button
                type="primary"
                size="large"
                block
                onClick={handleOTPSubmit}
                loading={isLoading}
              >
                Verify & Login
              </Button>

              <Button
                type="link"
                onClick={handleBack}
                icon={<ArrowLeftOutlined />}
                style={{ width: '100%' }}
              >
                Change Number
              </Button>

              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="link" 
                  onClick={() => requestOTP(phoneNumber)}
                  disabled={isLoading}
                >
                  Resend OTP
                </Button>
              </div>
            </Space>
          )}

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don&apos;t have an account?{' '}
              <Button type="link" onClick={() => navigate('/register')}>
                Register
              </Button>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Login
