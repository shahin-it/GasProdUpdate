
# GasPro Analytics - Supabase Setup Guide

This application is a TV-optimized dashboard for monitoring gas production. It is configured to talk to **Supabase** for real-time data and persistent storage.

## 1. Prerequisites
- **Google Gemini API Key**: Get one at [Google AI Studio](https://aistudio.google.com/).
- **Supabase Account**: Create a project at [supabase.com](https://supabase.com).

## 2. Database Schema
Run the following SQL in your Supabase **SQL Editor** to create the tables:

```sql
-- Production Records Table
CREATE TABLE IF NOT EXISTS production_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personnel Records Table
CREATE TABLE IF NOT EXISTS personnel_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  officers INTEGER NOT NULL,
  employees INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_prod_date ON production_records(date);
CREATE INDEX IF NOT EXISTS idx_pers_date ON personnel_records(date);
```

## 3. Row Level Security (RLS) Policies
If you have enabled RLS, you **must** run these commands to allow the application to access data. Since this app uses the Anonymous key for internal company use, we grant access to the `anon` role.

### For Production Records
```sql
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."production_records"
FOR SELECT USING (true);

CREATE POLICY "Enable insert for anon users" ON "public"."production_records"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anon users" ON "public"."production_records"
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for anon users" ON "public"."production_records"
FOR DELETE USING (true);
```

### For Personnel Records
```sql
ALTER TABLE personnel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."personnel_records"
FOR SELECT USING (true);

CREATE POLICY "Enable insert for anon users" ON "public"."personnel_records"
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anon users" ON "public"."personnel_records"
FOR UPDATE USING (true);

CREATE POLICY "Enable delete for anon users" ON "public"."personnel_records"
FOR DELETE USING (true);
```

## 4. Environment Variables
Configure your environment with:
- `API_KEY`: Your Google Gemini API Key.
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Anonymous API Key.
