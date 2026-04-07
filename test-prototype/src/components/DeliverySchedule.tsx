import React from 'react';
import { Table, Tag, Button, Space, Timeline } from 'antd';
import { DeliverySchedule } from '../types';

interface DeliveryScheduleProps {
  schedules: DeliverySchedule[];
}

export const DeliverySchedule: React.FC<DeliveryScheduleProps> = ({ schedules }) => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Time Slot',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
    },
    {
      title: 'Driver',
      dataIndex: 'driver',
      key: 'driver',
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicle',
      key: 'vehicle',
    },
    {
      title: 'Stops',
      dataIndex: 'stops',
      key: 'stops',
      render: (stops: any[]) => (
        <Timeline mode="left" style={{ fontSize: '12px' }}>
          {stops.slice(0, 2).map((stop, index) => (
            <Timeline.Item key={index} dot={<div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stop.status === 'completed' ? 'green' : 'orange' }} />}>
              {stop.address}
            </Timeline.Item>
          ))}
          {stops.length > 2 && <Timeline.Item>+{stops.length - 2} more stops</Timeline.Item>}
        </Timeline>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'scheduled': 'blue',
          'in-progress': 'orange',
          'completed': 'green',
          'cancelled': 'red',
        };
        return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">View Route</Button>
          <Button type="link" size="small">Update Status</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Delivery Schedule</h3>
        <Space>
          <Button type="primary">Schedule Delivery</Button>
          <Button>Optimize Routes</Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={schedules} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '16px' }}>
              <h4>All Stops:</h4>
              <ul>
                {record.stops.map((stop, index) => (
                  <li key={index}>
                    <strong>{stop.customer}</strong>: {stop.address} - 
                    <Tag color={stop.status === 'completed' ? 'green' : 'orange'} style={{ marginLeft: '8px' }}>
                      {stop.status}
                    </Tag>
                  </li>
                ))}
              </ul>
            </div>
          ),
        }}
      />
    </div>
  );
};