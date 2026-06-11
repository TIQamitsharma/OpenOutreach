-- Re-seed admin_settings which somehow got 0 rows
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Verify user_configs unique index exists (needed for PostgREST upsert onConflict)
-- Drop and recreate to be sure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'user_configs' AND indexname = 'user_configs_user_id_key'
  ) THEN
    ALTER TABLE user_configs ADD CONSTRAINT user_configs_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Verify daemon_status unique index exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'daemon_status' AND indexname = 'daemon_status_user_id_key'
  ) THEN
    ALTER TABLE daemon_status ADD CONSTRAINT daemon_status_user_id_key UNIQUE (user_id);
  END IF;
END $$;
