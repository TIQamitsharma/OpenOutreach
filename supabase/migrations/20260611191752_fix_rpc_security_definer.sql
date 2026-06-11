-- Fix security issues: revoke public/anon access and drop SECURITY DEFINER
-- from upsert_user_config (SECURITY INVOKER works fine since auth.uid()
-- and RLS policies correctly scope the INSERT...ON CONFLICT).

-- 1. Recreate upsert_user_config as SECURITY INVOKER (no elevated privilege needed)
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
SECURITY INVOKER
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
    llm_provider, llm_api_key, llm_api_base, ai_model,
    linkedin_username, linkedin_password_enc,
    connect_daily_limit, connect_weekly_limit, follow_up_daily_limit,
    active_hours_enabled, active_start_hour, active_end_hour,
    active_timezone, rest_days
  ) VALUES (
    v_user_id,
    p_llm_provider, p_llm_api_key, p_llm_api_base, p_ai_model,
    p_linkedin_username, p_linkedin_password_enc,
    p_connect_daily_limit, p_connect_weekly_limit, p_follow_up_daily_limit,
    p_active_hours_enabled, p_active_start_hour, p_active_end_hour,
    p_active_timezone, p_rest_days
  )
  ON CONFLICT (user_id) DO UPDATE SET
    llm_provider          = EXCLUDED.llm_provider,
    llm_api_key           = EXCLUDED.llm_api_key,
    llm_api_base          = EXCLUDED.llm_api_base,
    ai_model              = EXCLUDED.ai_model,
    linkedin_username     = EXCLUDED.linkedin_username,
    linkedin_password_enc = EXCLUDED.linkedin_password_enc,
    connect_daily_limit   = EXCLUDED.connect_daily_limit,
    connect_weekly_limit  = EXCLUDED.connect_weekly_limit,
    follow_up_daily_limit = EXCLUDED.follow_up_daily_limit,
    active_hours_enabled  = EXCLUDED.active_hours_enabled,
    active_start_hour     = EXCLUDED.active_start_hour,
    active_end_hour       = EXCLUDED.active_end_hour,
    active_timezone       = EXCLUDED.active_timezone,
    rest_days             = EXCLUDED.rest_days,
    updated_at            = now();
END;
$$;

-- Revoke from public (covers anon) then grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.upsert_user_config(
  text, text, text, text, text, text,
  integer, integer, integer,
  boolean, integer, integer, text, integer[]
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.upsert_user_config(
  text, text, text, text, text, text,
  integer, integer, integer,
  boolean, integer, integer, text, integer[]
) TO authenticated;

-- 2. seed_admin_settings is no longer needed (row seeded by migration).
--    Revoke execute from everyone so it cannot be called via REST at all.
REVOKE EXECUTE ON FUNCTION public.seed_admin_settings() FROM PUBLIC, anon, authenticated;
