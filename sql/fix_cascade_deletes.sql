-- Fix ON DELETE CASCADE for all foreign keys referencing auth.users(id)
-- Required for GDPR-compliant user deletion from Supabase auth

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ba_users DROP CONSTRAINT IF EXISTS ba_users_id_fkey;
ALTER TABLE ba_users ADD CONSTRAINT ba_users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_user_id_fkey;
ALTER TABLE saved_jobs ADD CONSTRAINT saved_jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE dispatch_records DROP CONSTRAINT IF EXISTS dispatch_records_worker_user_id_fkey;
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_worker_user_id_fkey
  FOREIGN KEY (worker_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE financial_events DROP CONSTRAINT IF EXISTS financial_events_user_id_fkey;
ALTER TABLE financial_events ADD CONSTRAINT financial_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
