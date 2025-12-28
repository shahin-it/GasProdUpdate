
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductionRecord } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Only create the client if we have credentials to prevent initialization errors
const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const dbService = {
  /**
   * Checks if the database service is properly configured
   */
  isConfigured(): boolean {
    return !!supabase;
  },

  /**
   * Fetches all production records from PostgreSQL
   */
  async getRecords(): Promise<ProductionRecord[]> {
    if (!supabase) {
      console.warn('PostgreSQL not configured. Using fallback data.');
      return [];
    }

    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('PostgreSQL Fetch Error:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Adds a new production record to PostgreSQL
   */
  async addRecord(record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('production_records')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('PostgreSQL Insert Error:', error.message);
      return null;
    }
    return data;
  },

  /**
   * Updates an existing production record in PostgreSQL
   */
  async updateRecord(id: string, record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('production_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PostgreSQL Update Error:', error.message);
      return null;
    }
    return data;
  },

  /**
   * Deletes a production record from PostgreSQL
   */
  async deleteRecord(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('production_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('PostgreSQL Delete Error:', error.message);
      return false;
    }
    return true;
  }
};
