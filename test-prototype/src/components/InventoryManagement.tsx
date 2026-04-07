import React from 'react';
import { Table, Tag, Progress, Button, Space } from 'antd';
import { InventoryItem } from '../types';

interface InventoryManagementProps {
  inventory: InventoryItem[];
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ inventory }) => {
  const getStockLevel = (quantity: number, min: number, max: number) => {
    const percentage = ((quantity - min) / (max - min)) * 100;
    if (quantity < min * 1.1) return { status: 'error', text: 'Low Stock' };
    if (quantity > max * 0.9) return { status: 'success', text: 'High Stock' };
    return { status: 'normal', text: 'Normal' };
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Stock Level',
      key: 'stockLevel',
      render: (record: InventoryItem) => {
        const { status, text } = getStockLevel(record.quantity, record.minStockLevel, record.maxStockLevel);
        const percentage = (record.quantity / record.maxStockLevel) * 100;
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Progress 
              percent={Math.round(percentage)} 
              status={status as any}
              size="small"
            />
            <span>{text}</span>
          </Space>
        );
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">Adjust Stock</Button>
          <Button type="link" size="small">Move Item</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3>Inventory Management</h3>
        <Space>
          <Button type="primary">Add New Item</Button>
          <Button>Generate Stock Report</Button>
        </Space>
      </div>
      <Table 
        columns={columns} 
        dataSource={inventory} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};