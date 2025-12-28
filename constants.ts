
import { FieldInfo, ProductionRecord, PersonnelRecord } from './types';

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
  { id: '1', field: 'Alpha West', amount: 450, date: '2024-05-01' },
  { id: '2', field: 'Bravo Shore', amount: 320, date: '2024-05-01' },
  { id: '3', field: 'Charlie Deep', amount: 150, date: '2024-05-01' },
  { id: '4', field: 'Delta Heights', amount: 580, date: '2024-05-01' },
  { id: '5', field: 'Echo Flat', amount: 290, date: '2024-05-01' },
  { id: '6', field: 'Foxtrot Valley', amount: 0, date: '2024-05-01' },
  { id: '7', field: 'Alpha West', amount: 465, date: '2024-05-02' },
  { id: '8', field: 'Bravo Shore', amount: 310, date: '2024-05-02' },
  { id: '9', field: 'Charlie Deep', amount: 145, date: '2024-05-02' },
  { id: '10', field: 'Delta Heights', amount: 590, date: '2024-05-02' },
  { id: '11', field: 'Echo Flat', amount: 305, date: '2024-05-02' },
  { id: '12', field: 'Foxtrot Valley', amount: 0, date: '2024-05-02' },
];

export const INITIAL_PERSONNEL_DATA: PersonnelRecord[] = [
  { id: 'p1', date: '2024-05-01', officers: 52, employees: 205 },
  { id: 'p2', date: '2024-05-02', officers: 52, employees: 209 },
  { id: 'p3', date: '2024-05-03', officers: 53, employees: 215 },
];
