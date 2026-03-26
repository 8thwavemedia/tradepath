-- ── Jobs table: holds all job details ────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name            TEXT NOT NULL,
  contractor              TEXT,
  city                    TEXT,
  state                   TEXT,
  trade                   TEXT,
  wage                    NUMERIC NOT NULL,
  ot_rate                 NUMERIC,
  per_diem                NUMERIC DEFAULT 0,
  schedule                TEXT DEFAULT '5/10s',
  hours_regular           INTEGER DEFAULT 40,
  hours_ot                INTEGER DEFAULT 10,
  days_per_week           INTEGER DEFAULT 5,
  start_date              DATE,
  end_date                DATE,
  certifications_required TEXT,
  drug_test               BOOLEAN DEFAULT false,
  background_check        BOOLEAN DEFAULT false,
  notes                   TEXT,
  created_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs they created"
  ON jobs FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = created_by);

-- ── Saved jobs table: junction linking users to ranked jobs ──────────────
CREATE TABLE IF NOT EXISTS saved_jobs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id        UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  rank_position INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs"
  ON saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs"
  ON saved_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs"
  ON saved_jobs FOR DELETE
  USING (auth.uid() = user_id);
