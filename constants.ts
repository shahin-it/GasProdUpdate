
import { FieldInfo, ProductionRecord, PersonnelRecord } from './types';

export const FIELDS: FieldInfo[] = [
  { id: 'f1', name: 'তিতাস ফিল্ড', location: 'ব্রাহ্মণবাড়িয়া', status: 'Active' },
  { id: 'f2', name: 'হবিগঞ্জ ফিল্ড', location: 'হবিগঞ্জ', status: 'Active' },
  { id: 'f3', name: 'বাখরাবাদ ফিল্ড', location: 'কুমিল্লা', status: 'Maintenance' },
  { id: 'f4', name: 'নরসিংদী ফিল্ড', location: 'নরসিংদী', status: 'Active' },
  { id: 'f5', name: 'মেঘনা ফিল্ড', location: 'ব্রাহ্মণবাড়িয়া', status: 'Active' },
  { id: 'f6', name: 'কামতা ফিল্ড', location: 'গাজীপুর', status: 'Standby' },
];

export const ALLOWED_ADMIN_IPS = [
  '127.0.0.1', 
  'localhost',
  '::1',
  '103.107.77.52',
  '103.107.77.53',
  '103.107.77.54',
  '180.211.179.202'
];

export const INITIAL_MOCK_DATA: ProductionRecord[] = [
  { id: '1', field: 'তিতাস ফিল্ড', amount: 450, date: '2024-05-01' },
  { id: '2', field: 'হবিগঞ্জ ফিল্ড', amount: 320, date: '2024-05-01' },
  { id: '3', field: 'বাখরাবাদ ফিল্ড', amount: 150, date: '2024-05-01' },
  { id: '4', field: 'নরসিংদী ফিল্ড', amount: 580, date: '2024-05-01' },
  { id: '5', field: 'মেঘনা ফিল্ড', amount: 290, date: '2024-05-01' },
  { id: '6', field: 'কামতা ফিল্ড', amount: 0, date: '2024-05-01' },
  { id: '7', field: 'তিতাস ফিল্ড', amount: 465, date: '2024-05-02' },
  { id: '8', field: 'হবিগঞ্জ ফিল্ড', amount: 310, date: '2024-05-02' },
  { id: '9', field: 'বাখরাবাদ ফিল্ড', amount: 145, date: '2024-05-02' },
  { id: '10', field: 'নরসিংদী ফিল্ড', amount: 590, date: '2024-05-02' },
  { id: '11', field: 'মেঘনা ফিল্ড', amount: 305, date: '2024-05-02' },
  { id: '12', field: 'কামতা ফিল্ড', amount: 0, date: '2024-05-02' },
];

export const INITIAL_PERSONNEL_DATA: PersonnelRecord[] = [
  { id: 'p1', date: '2024-05-01', officers: 52, employees: 205 },
  { id: 'p2', date: '2024-05-02', officers: 52, employees: 209 },
  { id: 'p3', date: '2024-05-03', officers: 53, employees: 215 },
];