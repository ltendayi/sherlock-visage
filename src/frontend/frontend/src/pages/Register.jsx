/**
 * VoltLedger Registration Page
 * User registration with KYC (Kenyan ID validation)
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
  Select,
  DatePicker,
  Checkbox,
  message,
  Divider
} from 'antd'
import { 
  UserOutlined, 
  SafetyOutlined, 
  IdcardOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PhoneOutlined
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { 
  validateKenyanPhone, 
  validateKenyanID, 
  formatKenyanPhone 
} from '../utils/validators'
import { KENYA_COUNTIES } from '../styles/theme'

const { Title, Text } = Typography

const Register = () => {
  const navigate = useNavigate()
  const { user, register, updateProfile, isLoading, error, clearError } = useAuth()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [registrationData, setRegistrationData] = useState({
    phoneNumber: user?.phone_number || '',
    mpesaConsent: false,
  })
  const [counties, setCounties] = useState(KENYA_COUNTIES)
  const [wards, setWards] = useState([])

  const handlePhoneSubmit = async (values) => {
    const formattedPhone = formatKenyanPhone(values.phone)
    
    if (!validateKenyanPhone(formattedPhone)) {
      message.error('Please enter a valid Kenyan phone number')
      return
    }

    setRegistrationData(prev => ({ ...prev, phoneNumber: formattedPhone }))
    setCurrentStep(1)
  }

  const handleKYCSubmit = async (values) => {
    if (!validateKenyanID(values.idNumber)) {
      message.error('Please enter a valid Kenyan National ID (8-9 digits)')
      return
    }

    const userData = {
      phoneNumber: registrationData.phoneNumber,
      fullName: values.fullName,
      idNumber: values.idNumber,
      dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      homeCounty: values.homeCounty,
      homeWard: values.homeWard,
      emergencyContact: values.emergencyContact,
      mpesaConsent: values.mpesaConsent,
    }

    const result = await register(userData)
    if (result.success) {
      message.success('Registration successful!')
      navigate('/dashboard')
    } else {
      message.error(result.error || 'Registration failed')
    }
  }

  const handleCountyChange = (county) => {
    // In a real app, this would fetch wards for the selected county
    // For now, we'll use mock wards
    const mockWards = [
      'Central Ward',
      'East Ward', 
      'West Ward',
      'North Ward',
      'South Ward'
    ]
    setWards(mockWards)
  }

  const steps = [
    {
      title: 'Phone',
      icon: <PhoneOutlined />,
    },
    {
      title: 'Profile',
      icon: <UserOutlined />,
    },
    {
      title: 'KYC',
      icon: <IdcardOutlined />,
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
      <Card style={{ width: '100%', maxWidth: 500 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Create Account
            </Title>
            <Text type="secondary">Join VoltLedger today</Text>
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

          {currentStep === 0 && (
            <Form
              name="phone-step"
              onFinish={handlePhoneSubmit}
              layout="vertical"
              initialValues={{ phone: user?.phone_number || '' }}
            >
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter your phone number' },
                ]}
                extra="Format: 2547XXXXXXXX or 07XX XXX XXX"
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="07XX XXX XXX"
                  size="large"
                  disabled={!!user?.phone_number}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                >
                  Continue
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  Already have an account?{' '}
                  <Button type="link" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                </Text>
              </div>
            </Form>
          )}

          {currentStep === 1 && (
            <Form
              name="profile-step"
              form={form}
              onFinish={handleKYCSubmit}
              layout="vertical"
            >
              <Form.Item
                name="fullName"
                label="Full Name"
                rules={[
                  { required: true, message: 'Please enter your full name' },
                  { min: 3, message: 'Name must be at least 3 characters' },
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="John Kamau"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="idNumber"
                label="National ID Number"
                rules={[
                  { required: true, message: 'Please enter your ID number' },
                ]}
                extra="Huduma Namba or National ID (8-9 digits)"
              >
                <Input 
                  prefix={<IdcardOutlined />}
                  placeholder="12345678"
                  size="large"
                  maxLength={9}
                />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[
                  { required: true, message: 'Please select your date of birth' },
                ]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder="Select date"
                />
              </Form.Item>

              <Divider />

              <Form.Item
                name="homeCounty"
                label="Home County"
                rules={[
                  { required: true, message: 'Please select your county' },
                ]}
              >
                <Select
                  placeholder="Select county"
                  size="large"
                  onChange={handleCountyChange}
                  showSearch
                  options={counties.map(c => ({ value: c, label: c }))}
                />
              </Form.Item>

              <Form.Item
                name="homeWard"
                label="Home Ward"
                rules={[
                  { required: true, message: 'Please select your ward' },
                ]}
              >
                <Select
                  placeholder="Select ward"
                  size="large"
                  showSearch
                  options={wards.map(w => ({ value: w, label: w }))}
                />
              </Form.Item>

              <Form.Item
                name="emergencyContact"
                label="Emergency Contact (Phone)"
                rules={[
                  { required: true, message: 'Please enter emergency contact' },
                ]}
                extra="Format: 07XX XXX XXX"
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  placeholder="07XX XXX XXX"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="mpesaConsent"
                valuePropName="checked"
                rules={[
                  { 
                    validator: (_, value) => 
                      value ? Promise.resolve() : Promise.reject(new Error('You must accept to continue'))
                  }
                ]}
              >
                <Checkbox>
                  I consent to M-Pesa integration for payments
                </Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={isLoading}
                  icon={<CheckCircleOutlined />}
                >
                  Complete Registration
                </Button>
              </Form.Item>

              <Button
                onClick={() => setCurrentStep(0)}
                style={{ width: '100%' }}
              >
                Back
              </Button>
            </Form>
          )}
        </Space>
      </Card>
    </div>
  )
}

export default Register
