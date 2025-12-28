
export interface ProductionRecord {
  id: string;
  field: string;
  amount: number; // in MCF (Million Cubic Feet)
  date: string;
  officers: number;
  employees: number;
}

export interface FieldInfo {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Maintenance' | 'Standby';
}

export type ViewType = 'dashboard' | 'admin';
