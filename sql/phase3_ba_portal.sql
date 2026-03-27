-- Phase 3: BA Portal schema

CREATE TABLE IF NOT EXISTS locals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  union_name TEXT NOT NULL,
  trade TEXT NOT NULL,
  local_number TEXT,
  city TEXT,
  state TEXT,
  ba_email TEXT,
  ba_phone TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  subscription_active BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ba_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  local_id UUID REFERENCES locals(id),
  full_name TEXT,
  title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ba_job_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  posted_by UUID REFERENCES ba_users(id),
  local_id UUID REFERENCES locals(id),
  project_name TEXT NOT NULL,
  contractor TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  trade TEXT NOT NULL,
  wage NUMERIC NOT NULL,
  ot_rate NUMERIC,
  per_diem NUMERIC DEFAULT 0,
  schedule TEXT NOT NULL,
  hours_regular INTEGER DEFAULT 40,
  hours_ot INTEGER DEFAULT 0,
  days_per_week INTEGER DEFAULT 5,
  start_date DATE,
  end_date DATE,
  crew_size INTEGER,
  certifications_required TEXT[],
  drug_test BOOLEAN DEFAULT FALSE,
  background_check BOOLEAN DEFAULT FALSE,
  twic_required BOOLEAN DEFAULT FALSE,
  union_portal_only BOOLEAN DEFAULT TRUE,
  posting_status TEXT DEFAULT 'active',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS dispatch_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  local_id UUID REFERENCES locals(id),
  ba_user_id UUID REFERENCES ba_users(id),
  worker_user_id UUID REFERENCES auth.users(id),
  job_posting_id UUID REFERENCES ba_job_postings(id),
  offer_sent_at TIMESTAMPTZ DEFAULT NOW(),
  response TEXT,
  response_at TIMESTAMPTZ,
  decline_reason TEXT,
  notes TEXT
);

ALTER TABLE locals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ba_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ba_job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BA users can manage their local" ON locals
  FOR ALL USING (
    id IN (SELECT local_id FROM ba_users WHERE id = auth.uid())
  );

CREATE POLICY "BA users can manage their own record" ON ba_users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "BA users can manage their postings" ON ba_job_postings
  FOR ALL USING (
    local_id IN (SELECT local_id FROM ba_users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can view active postings" ON ba_job_postings
  FOR SELECT USING (auth.role() = 'authenticated' AND posting_status = 'active');

CREATE POLICY "BA users can manage dispatch records for their local" ON dispatch_records
  FOR ALL USING (
    local_id IN (SELECT local_id FROM ba_users WHERE id = auth.uid())
  );
