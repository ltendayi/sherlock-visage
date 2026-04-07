import React from 'react';
import { Tabs } from 'antd';
import { DashboardLayout } from './components/DashboardLayout';
import { StatsCards } from './components/StatsCards';
import { ShipmentTracking } from './components/ShipmentTracking';
import { InventoryManagement } from './components/InventoryManagement';
import { DeliverySchedule } from './components/DeliverySchedule';
import { 
  generateShipments, 
  generateInventory, 
  generateDeliverySchedule, 
  generateDashboardStats 
} from './utils/mockData';

const { TabPane } = Tabs;

function App() {
  const shipments = generateShipments(50);
  const inventory = generateInventory(30);
  const schedules = generateDeliverySchedule(20);
  const stats = generateDashboardStats();

  return (
    <DashboardLayout>
      <StatsCards stats={stats} />
      <Tabs defaultActiveKey="1">
        <TabPane tab="Overview" key="1">
          <div style={{ padding: '24px', background: '#fff' }}>
            <h3>Welcome to Logistics Dashboard</h3>
            <p>This dashboard provides real-time tracking of shipments, inventory levels, and delivery schedules.</p>
            <ShipmentTracking shipments={shipments.slice(0, 5)} />
          </div>
        </TabPane>
        <TabPane tab="Shipment Tracking" key="2">
          <ShipmentTracking shipments={shipments} />
        </TabPane>
        <TabPane tab="Inventory Management" key="3">
          <InventoryManagement inventory={inventory} />
        </TabPane>
        <TabPane tab="Delivery Schedule" key="4">
          <DeliverySchedule schedules={schedules} />
        </TabPane>
      </Tabs>
    </DashboardLayout>
  );
}

export default App;