-- Bypass RLS to seed the admin_settings singleton row
-- The INSERT in the original migration ran with RLS active, so it may have been blocked
-- This runs as postgres superuser via migration

-- Temporarily disable RLS to insert seed data
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO admin_settings (id, razorpay_key_id, razorpay_key_secret, maintenance_mode, announcement)
VALUES (1, '', '', false, '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Also add an admin_settings INSERT policy so future re-seeding via service role works
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_settings' AND policyname = 'Service role can insert admin settings'
  ) THEN
    -- Allow service_role to bypass RLS entirely (it does by default, but be explicit)
    -- The real fix is to allow the seed INSERT; service role bypasses RLS anyway
    NULL;
  END IF;
END $$;
