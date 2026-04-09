/**
 * VoltLedger Bikes Page
 * Browse available bikes by location (county-based filtering)
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space,
  Select,
  Badge,
  Tag,
  Skeleton,
  Empty,
  FloatButton,
  Divider
} from 'antd'
import {
  BikeOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  LocationOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import useBikeStore from '../store/bikeStore'
import { useGeolocation } from '../hooks/useGeolocation'
import { formatCurrency, calculateDistance } from '../utils/validators'
import { getStatusColor } from '../utils/helpers'

const { Content } = Layout
const { Title, Text } = Typography

const Bikes = () => {
  const navigate = useNavigate()
  const { 
    bikes, 
    counties, 
    wards,
    isLoading, 
    filters,
    fetchBikes, 
    fetchCounties,
    fetchWards,
    searchNearby,
    setFilters,
    selectBike
  } = useBikeStore()
  
  const { location, getLocation } = useGeolocation()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCounties()
    fetchBikes()
  }, [])

  useEffect(() => {
    if (filters.county) {
      fetchWards(filters.county)
    }
  }, [filters.county])

  const handleCountyChange = (county) => {
    setFilters({ county, ward: null })
    fetchBikes({ ...filters, county, ward: null })
  }

  const handleWardChange = (ward) => {
    setFilters({ ward })
    fetchBikes({ ...filters, ward })
  }

  const handleNearbySearch = async () => {
    if (!location) {
      getLocation()
      return
    }
    await searchNearby(location.latitude, location.longitude, 10)
  }

  const handleBookNow = (bike) => {
    selectBike(bike)
    navigate('/book-loan')
  }

  const getDistance = (bike) => {
    if (!location || !bike.gps_lat || !bike.gps_lng) return null
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      bike.gps_lat,
      bike.gps_lng
    )
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '16px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Available Bikes
            </Title>
            <Text type="secondary">
              Find an e-bike near you
            </Text>
          </div>

          {/* Filters */}
          <Card size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Button 
                  icon={<LocationOutlined />}
                  onClick={handleNearbySearch}
                  loading={!location}
                >
                  Nearby
                </Button>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
              </Space>

              {showFilters && (
                <>
                  <Select
                    placeholder="Select County"
                    value={filters.county}
                    onChange={handleCountyChange}
                    allowClear
                    showSearch
                    style={{ width: '100%' }}
                    options={counties.map(c => ({ value: c, label: c }))}
                  />
                  
                  {filters.county && (
                    <Select
                      placeholder="Select Ward"
                      value={filters.ward}
                      onChange={handleWardChange}
                      allowClear
                      showSearch
                      style={{ width: '100%' }}
                      options={wards.map(w => ({ value: w, label: w }))}
                    />
                  )}
                </>
              )}
            </Space>
          </Card>

          {/* Bikes Grid */}
          {isLoading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map(i => (
                <Col xs={24} sm={12} lg={8} key={i}>
                  <Skeleton active />
                </Col>
              ))}
            </Row>
          ) : bikes.length > 0 ? (
            <Row gutter={[16, 16]}>
              {bikes.map((bike) => (
                <Col xs={24} sm={12} lg={8} key={bike.bike_id}>
                  <Card
                    hoverable
                    className="bike-card"
                    cover={
                      <div style={{ 
                        height: 150, 
                        background: '#f0f2f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BikeOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />
                      </div>
                    }
                    actions={[
                      <Button 
                        type="primary" 
                        onClick={() => handleBookNow(bike)}
                        block
                        style={{ margin: '0 8px' }}
                      >
                        Book Now
                      </Button>
                    ]}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text strong>{bike.model || 'E-Bike'}</Text>
                        <Tag color={getStatusColor(bike.status)}>
                          {bike.status?.toUpperCase()}
                        </Tag>
                      </Space>
                      
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <EnvironmentOutlined /> {bike.location?.name || 'Unknown Location'}
                      </Text>

                      {getDistance(bike) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <LocationOutlined /> {getDistance(bike)} away
                        </Text>
                      )}

                      <Divider style={{ margin: '8px 0' }} />

                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Space direction="vertical" size={0}>
                          <Text strong style={{ color: '#1890ff' }}>
                            {formatCurrency(bike.daily_rate_kes)}<Text type="secondary" style={{ fontSize: 12 }}>/day</Text>
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Deposit: {formatCurrency(bike.deposit_amount_kes)}
                          </Text>
                        </Space>
                        
                        <Badge 
                          count={`${bike.current_battery_pct || 0}%`}
                          style={{ 
                            backgroundColor: bike.current_battery_pct > 50 ? '#52c41a' : '#faad14'
                          }}
                        />
                      </Space>

                      {bike.current_battery_pct !== undefined && (
                        <Space style={{ fontSize: 12 }}>
                          <ThunderboltOutlined 
                            style={{ 
                              color: bike.current_battery_pct > 50 ? '#52c41a' : '#faad14'
                            }} 
                          />
                          <Text type="secondary">Battery: {bike.current_battery_pct}%</Text>
                        </Space>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No bikes available in this area"
            >
              <Button type="primary" onClick={() => {setFilters({}); fetchBikes()}}>
                Clear Filters
              </Button>
            </Empty>
          )}
        </Space>

        <FloatButton
          icon={<LocationOutlined />}
          tooltip="Find nearby bikes"
          onClick={handleNearbySearch}
        />
      </Content>
    </Layout>
  )
}

export default Bikes
