
export interface ProductionRecord {
  id: string;
  field: string;
  amount: number; // in MCF (Million Cubic Feet)
  condensate: number; // in BBL (Barrels)
  water: number; // in BBL (Barrels)
  date: string;
}

export interface PersonnelRecord {
  id: string;
  date: string;
  officers: number;
  employees: number;
  approved_officers?: number; // Target from Organogram
  approved_employees?: number; // Target from Organogram
}

export interface FieldInfo {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Maintenance' | 'Standby';
}

export type ViewType = 'dashboard' | 'admin';
