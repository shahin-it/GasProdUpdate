
# GasPro Analytics - Supabase Setup Guide

This application is a TV-optimized dashboard for monitoring gas production. It is configured to talk to **Supabase** for real-time data and persistent storage.

## 1. Prerequisites
- **Google Gemini API Key**: Get one at [Google AI Studio](https://aistudio.google.com/).
- **Supabase Account**: Create a project at [supabase.com](https://supabase.com).

## 2. Database Configuration
Run the following SQL in your Supabase **SQL Editor** to create the necessary tables:

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

-- Indices
CREATE INDEX IF NOT EXISTS idx_prod_date ON production_records(date);
CREATE INDEX IF NOT EXISTS idx_pers_date ON personnel_records(date);
```

## 3. Environment Variables
Configure your environment with:

- `API_KEY`: Your Google Gemini API Key.
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Anonymous API Key.

## 4. Local Development
1. Install Vite: `npm install -g vite`
2. Create a `.env` file with your keys.
3. Run `npx vite`.

*If the Supabase keys are not provided, the app defaults to **Mock Mode** using LocalStorage.*
