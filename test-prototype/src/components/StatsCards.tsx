import React from 'react';
import { Card, Row, Col } from 'antd';
import { DashboardStats } from '../types';
import { TruckOutlined, InboxOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TruckOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '16px' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>Total Shipments</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalShipments}</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginRight: '16px' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>In Transit</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.shipmentsInTransit}</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InboxOutlined style={{ fontSize: '24px', color: '#52c41a', marginRight: '16px' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>Low Stock Items</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.lowStockItems}</div>
            </div>
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: '24px', color: '#722ed1', marginRight: '16px' }} />
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>Deliveries Today</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.deliveriesToday}</div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};