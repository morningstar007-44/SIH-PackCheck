-- ============================================================
-- PackCheck Supabase Database Schema
-- Legal Metrology (Packaged Commodities) Rules, 2011
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'inspector',
  organization TEXT DEFAULT 'Department of Legal Metrology',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe for re-runs)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ==========================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, organization)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'inspector',
    'Department of Legal Metrology'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to avoid duplicates on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 3. INSPECTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT,
  category TEXT,
  inspection_date TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  compliance_score NUMERIC(5,2),
  overall_result TEXT CHECK (overall_result IN ('compliant', 'non_compliant', 'requires_review')),
  image_urls TEXT[],
  ocr_raw_text TEXT,
  ocr_confidence NUMERIC(5,2),
  extracted_declarations JSONB,
  rule_results JSONB,
  total_rules_checked INTEGER DEFAULT 0,
  rules_passed INTEGER DEFAULT 0,
  rules_failed INTEGER DEFAULT 0,
  rules_review INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete own inspections" ON public.inspections;

CREATE POLICY "Users can view own inspections"
  ON public.inspections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspections"
  ON public.inspections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections"
  ON public.inspections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspections"
  ON public.inspections FOR DELETE
  USING (auth.uid() = user_id);


-- ==========================================
-- 4. RULE SETS TABLE (optional, for future custom rules)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rule_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rule_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can view rule sets" ON public.rule_sets;
CREATE POLICY "All authenticated users can view rule sets"
  ON public.rule_sets FOR SELECT
  TO authenticated
  USING (true);


-- ==========================================
-- 5. STORAGE BUCKET FOR INSPECTION IMAGES
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-images', 'inspection-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'inspection-images');

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'inspection-images');
