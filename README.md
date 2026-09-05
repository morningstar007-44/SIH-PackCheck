# PackCheck — Legal Metrology Package Inspection

"Package inspection, made simpler."

## Overview
PackCheck is a web application that assists Legal Metrology inspectors in verifying whether product packaging declarations comply with the Legal Metrology (Packaged Commodities) Rules.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Backend & DB**: Supabase (Auth, PostgreSQL, Storage, RLS)
- **OCR Engine**: Tesseract.js (browser-based)
- **PDF Generation**: jsPDF

## Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Supabase project credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Install dependencies and start dev server:
   ```bash
   npm install
   npm run dev
   ```

## Supabase Migration
Run the SQL scripts provided in `supabase/migrations/` in your Supabase SQL Editor to configure tables (`profiles`, `inspections`, `rule_sets`), Row Level Security policies, and Storage buckets.
