
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { ProductionRecord, PersonnelRecord } from '../types.ts';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const dbService = {
  isConfigured(): boolean {
    return !!supabase;
  },

  // Real-time Subscriptions
  subscribeToChanges(callback: (payload: any) => void): RealtimeChannel | null {
    if (!supabase) return null;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_records' },
        (payload) => callback({ type: 'production', ...payload })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personnel_records' },
        (payload) => callback({ type: 'personnel', ...payload })
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error. Check RLS policies for replication.');
        }
      });

    return channel;
  },

  // Production Records
  async getRecords(): Promise<ProductionRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Supabase Error (Production):', error.message, error.details);
      if (error.code === '42501') {
        console.warn('RLS Policy error detected. Please run the SQL policies provided in README.md');
      }
      return [];
    }
    return data || [];
  },

  async addRecord(record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('production_records')
      .insert([record])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding production record:', error.message);
      return null;
    }
    return data;
  },

  async updateRecord(id: string, record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('production_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating production record:', error.message);
      return null;
    }
    return data;
  },

  async deleteRecord(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('production_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting production record:', error.message);
      return false;
    }
    return true;
  },

  // Personnel Records
  async getPersonnelRecords(): Promise<PersonnelRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('personnel_records')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Supabase Error (Personnel):', error.message);
      return [];
    }
    return data || [];
  },

  async addPersonnelRecord(record: Omit<PersonnelRecord, 'id'>): Promise<PersonnelRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('personnel_records')
      .insert([record])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding personnel record:', error.message);
      return null;
    }
    return data;
  },

  async updatePersonnelRecord(id: string, record: Omit<PersonnelRecord, 'id'>): Promise<PersonnelRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('personnel_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating personnel record:', error.message);
      return null;
    }
    return data;
  },

  async deletePersonnelRecord(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('personnel_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting personnel record:', error.message);
      return false;
    }
    return true;
  }
};
