-- Add current job baseline columns to profiles table
-- These store the user's current job for comparison deltas on job rankings

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_job_wage       NUMERIC,
  ADD COLUMN IF NOT EXISTS current_job_ot_rate     NUMERIC,
  ADD COLUMN IF NOT EXISTS current_job_per_diem    NUMERIC,
  ADD COLUMN IF NOT EXISTS current_job_state       TEXT,
  ADD COLUMN IF NOT EXISTS current_job_schedule    TEXT,
  ADD COLUMN IF NOT EXISTS current_job_net_weekly  INTEGER;
