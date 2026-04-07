import { Shipment, InventoryItem, DeliverySchedule, DashboardStats } from '../types';

const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
const carriers = ['UPS', 'FedEx', 'DHL', 'USPS'];
const categories = ['Electronics', 'Clothing', 'Food', 'Medical', 'Industrial'];
const drivers = ['John Smith', 'Maria Garcia', 'Robert Chen', 'Lisa Johnson'];
const vehicles = ['Van-001', 'Van-002', 'Truck-101', 'Truck-102'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

export const generateShipments = (count: number): Shipment[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    trackingNumber: `TRK${10000 + i}`,
    status: ['pending', 'in-transit', 'delivered', 'delayed'][Math.floor(Math.random() * 4)] as any,
    origin: cities[Math.floor(Math.random() * cities.length)],
    destination: cities[Math.floor(Math.random() * cities.length)],
    estimatedDelivery: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    actualDelivery: Math.random() > 0.7 ? randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)) : undefined,
    weight: Math.floor(Math.random() * 100) + 1,
    carrier: carriers[Math.floor(Math.random() * carriers.length)],
  }));
};

export const generateInventory = (count: number): InventoryItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    name: `Item ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
    sku: `SKU-${1000 + i}`,
    quantity: Math.floor(Math.random() * 500),
    location: `Warehouse ${Math.floor(Math.random() * 5) + 1}-Aisle ${Math.floor(Math.random() * 10) + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    lastUpdated: randomDate(new Date(2024, 0, 1), new Date()),
    minStockLevel: 50,
    maxStockLevel: 400,
  }));
};

export const generateDeliverySchedule = (count: number): DeliverySchedule[] => {
  return Array.from({ length: count }, (_, i) => {
    const stopCount = Math.floor(Math.random() * 5) + 1;
    return {
      id: generateId(),
      date: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      timeSlot: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
      driver: drivers[Math.floor(Math.random() * drivers.length)],
      vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
      stops: Array.from({ length: stopCount }, (_, j) => ({
        address: `${100 + j} Main St, ${cities[Math.floor(Math.random() * cities.length)]}`,
        customer: `Customer ${j + 1}`,
        status: ['pending', 'completed', 'skipped'][Math.floor(Math.random() * 3)] as any,
      })),
      status: ['scheduled', 'in-progress', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as any,
    };
  });
};

export const generateDashboardStats = (): DashboardStats => {
  return {
    totalShipments: Math.floor(Math.random() * 1000) + 500,
    shipmentsInTransit: Math.floor(Math.random() * 200) + 50,
    lowStockItems: Math.floor(Math.random() * 50) + 5,
    deliveriesToday: Math.floor(Math.random() * 100) + 20,
  };
};