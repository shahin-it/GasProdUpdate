
import { FieldInfo, ProductionRecord } from './types';

export const FIELDS: FieldInfo[] = [
  { id: 'f1', name: 'Alpha West', location: 'North Sector', status: 'Active' },
  { id: 'f2', name: 'Bravo Shore', location: 'Coastal Basin', status: 'Active' },
  { id: 'f3', name: 'Charlie Deep', location: 'Southern Trench', status: 'Maintenance' },
  { id: 'f4', name: 'Delta Heights', location: 'East Highlands', status: 'Active' },
  { id: 'f5', name: 'Echo Flat', location: 'Central Plains', status: 'Active' },
  { id: 'f6', name: 'Foxtrot Valley', location: 'West Valley', status: 'Standby' },
];

export const ALLOWED_ADMIN_IPS = [
  '127.0.0.1', 
  'localhost',
  '::1',
  '203.0.113.1',
  '198.51.100.24',
  '180.211.179.202'
];

export const INITIAL_MOCK_DATA: ProductionRecord[] = [
  { id: '1', field: 'Alpha West', amount: 450, date: '2024-05-01', officers: 12, employees: 45 },
  { id: '2', field: 'Bravo Shore', amount: 320, date: '2024-05-01', officers: 8, employees: 30 },
  { id: '3', field: 'Charlie Deep', amount: 150, date: '2024-05-01', officers: 5, employees: 20 },
  { id: '4', field: 'Delta Heights', amount: 580, date: '2024-05-01', officers: 15, employees: 60 },
  { id: '5', field: 'Echo Flat', amount: 290, date: '2024-05-01', officers: 10, employees: 35 },
  { id: '6', field: 'Foxtrot Valley', amount: 0, date: '2024-05-01', officers: 2, employees: 5 },
  
  { id: '7', field: 'Alpha West', amount: 465, date: '2024-05-02', officers: 12, employees: 45 },
  { id: '8', field: 'Bravo Shore', amount: 310, date: '2024-05-02', officers: 8, employees: 30 },
  { id: '9', field: 'Charlie Deep', amount: 145, date: '2024-05-02', officers: 5, employees: 20 },
  { id: '10', field: 'Delta Heights', amount: 590, date: '2024-05-02', officers: 15, employees: 62 },
  { id: '11', field: 'Echo Flat', amount: 305, date: '2024-05-02', officers: 10, employees: 35 },
  { id: '12', field: 'Foxtrot Valley', amount: 0, date: '2024-05-02', officers: 2, employees: 5 },

  { id: '13', field: 'Alpha West', amount: 480, date: '2024-05-03', officers: 13, employees: 48 },
  { id: '14', field: 'Bravo Shore', amount: 330, date: '2024-05-03', officers: 8, employees: 31 },
  { id: '15', field: 'Charlie Deep', amount: 160, date: '2024-05-03', officers: 5, employees: 22 },
  { id: '16', field: 'Delta Heights', amount: 610, date: '2024-05-03', officers: 15, employees: 65 },
  { id: '17', field: 'Echo Flat', amount: 315, date: '2024-05-03', officers: 10, employees: 38 },
  { id: '18', field: 'Foxtrot Valley', amount: 0, date: '2024-05-03', officers: 2, employees: 5 },
];
