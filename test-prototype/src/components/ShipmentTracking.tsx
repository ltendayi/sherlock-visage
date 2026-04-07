import React from 'react';
import { Table, Tag, Space, Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Shipment } from '../types';

const { Search } = Input;

interface ShipmentTrackingProps {
  shipments: Shipment[];
}

export const ShipmentTracking: React.FC<ShipmentTrackingProps> = ({ shipments }) => {
  const columns = [
    {
      title: 'Tracking Number',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'pending': 'blue',
          'in-transit': 'orange',
          'delivered': 'green',
          'delayed': 'red',
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin',
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Estimated Delivery',
      dataIndex: 'estimatedDelivery',
      key: 'estimatedDelivery',
    },
    {
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">View Details</Button>
          <Button type="link" size="small">Update Status</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search shipments..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary">Add New Shipment</Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={shipments} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};