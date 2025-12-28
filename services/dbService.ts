
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductionRecord, PersonnelRecord } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const dbService = {
  isConfigured(): boolean {
    return !!supabase;
  },

  // Production Records
  async getRecords(): Promise<ProductionRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('production_records').select('*').order('date', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async addRecord(record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('production_records').insert([record]).select().single();
    return error ? null : data;
  },

  async updateRecord(id: string, record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('production_records').update(record).eq('id', id).select().single();
    return error ? null : data;
  },

  async deleteRecord(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('production_records').delete().eq('id', id);
    return !error;
  },

  // Personnel Records
  async getPersonnelRecords(): Promise<PersonnelRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('personnel_records').select('*').order('date', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async addPersonnelRecord(record: Omit<PersonnelRecord, 'id'>): Promise<PersonnelRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('personnel_records').insert([record]).select().single();
    return error ? null : data;
  },

  async updatePersonnelRecord(id: string, record: Omit<PersonnelRecord, 'id'>): Promise<PersonnelRecord | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('personnel_records').update(record).eq('id', id).select().single();
    return error ? null : data;
  },

  async deletePersonnelRecord(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('personnel_records').delete().eq('id', id);
    return !error;
  }
};
