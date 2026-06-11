-- RPC: upsert_user_config
-- Called by authenticated users to create or update their config row.
-- Uses SECURITY DEFINER so it runs as postgres and bypasses PostgREST
-- upsert quirks. Still validates auth.uid() matches.

CREATE OR REPLACE FUNCTION public.upsert_user_config(
  p_llm_provider text,
  p_llm_api_key text,
  p_llm_api_base text,
  p_ai_model text,
  p_linkedin_username text,
  p_linkedin_password_enc text,
  p_connect_daily_limit integer,
  p_connect_weekly_limit integer,
  p_follow_up_daily_limit integer,
  p_active_hours_enabled boolean,
  p_active_start_hour integer,
  p_active_end_hour integer,
  p_active_timezone text,
  p_rest_days integer[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO user_configs (
    user_id,
    llm_provider,
    llm_api_key,
    llm_api_base,
    ai_model,
    linkedin_username,
    linkedin_password_enc,
    connect_daily_limit,
    connect_weekly_limit,
    follow_up_daily_limit,
    active_hours_enabled,
    active_start_hour,
    active_end_hour,
    active_timezone,
    rest_days
  ) VALUES (
    v_user_id,
    p_llm_provider,
    p_llm_api_key,
    p_llm_api_base,
    p_ai_model,
    p_linkedin_username,
    p_linkedin_password_enc,
    p_connect_daily_limit,
    p_connect_weekly_limit,
    p_follow_up_daily_limit,
    p_active_hours_enabled,
    p_active_start_hour,
    p_active_end_hour,
    p_active_timezone,
    p_rest_days
  )
  ON CONFLICT (user_id) DO UPDATE SET
    llm_provider = EXCLUDED.llm_provider,
    llm_api_key = EXCLUDED.llm_api_key,
    llm_api_base = EXCLUDED.llm_api_base,
    ai_model = EXCLUDED.ai_model,
    linkedin_username = EXCLUDED.linkedin_username,
    linkedin_password_enc = EXCLUDED.linkedin_password_enc,
    connect_daily_limit = EXCLUDED.connect_daily_limit,
    connect_weekly_limit = EXCLUDED.connect_weekly_limit,
    follow_up_daily_limit = EXCLUDED.follow_up_daily_limit,
    active_hours_enabled = EXCLUDED.active_hours_enabled,
    active_start_hour = EXCLUDED.active_start_hour,
    active_end_hour = EXCLUDED.active_end_hour,
    active_timezone = EXCLUDED.active_timezone,
    rest_days = EXCLUDED.rest_days,
    updated_at = now();
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.upsert_user_config TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_user_config FROM anon;

-- RPC: seed_admin_settings
-- Called once by admin on first login to create the singleton settings row.
CREATE OR REPLACE FUNCTION public.seed_admin_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_admin_settings TO authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_admin_settings FROM anon;

-- Also seed admin_settings directly (running as postgres superuser here)
INSERT INTO admin_settings (id, razorpay_key_id, razorpay_key_secret, maintenance_mode, announcement)
VALUES (1, '', '', false, '')
ON CONFLICT (id) DO NOTHING;
