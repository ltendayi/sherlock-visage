export interface Shipment {
  id: string;
  trackingNumber: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed';
  origin: string;
  destination: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  weight: number;
  carrier: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  category: string;
  lastUpdated: string;
  minStockLevel: number;
  maxStockLevel: number;
}

export interface DeliverySchedule {
  id: string;
  date: string;
  timeSlot: string;
  driver: string;
  vehicle: string;
  stops: Array<{
    address: string;
    customer: string;
    status: 'pending' | 'completed' | 'skipped';
  }>;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface DashboardStats {
  totalShipments: number;
  shipmentsInTransit: number;
  lowStockItems: number;
  deliveriesToday: number;
}