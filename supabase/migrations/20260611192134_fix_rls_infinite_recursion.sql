-- Fix infinite recursion in user_profiles RLS policies.
--
-- Root cause: admin check policies on user_profiles (and other tables) do
--   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
-- That sub-SELECT triggers user_profiles' own SELECT policies, which run the
-- same EXISTS sub-SELECT → infinite recursion.
--
-- Fix: a SECURITY DEFINER function that reads user_profiles bypassing RLS.
-- All admin-check policies use this function instead of inline sub-SELECTs.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Authenticated users need EXECUTE so RLS policies can call it.
-- Anon cannot call it meaningfully (auth.uid() returns null → false).
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── user_profiles ────────────────────────────────────────────────────────────
-- Drop the recursive admin policies and replace with is_admin() versions.
DROP POLICY IF EXISTS "Admins can view all profiles"   ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── user_configs ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all configs" ON user_configs;

CREATE POLICY "Admins can view all configs"
  ON user_configs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── campaigns ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all campaigns" ON campaigns;

CREATE POLICY "Admins can view all campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── leads ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;

CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── deals ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all deals" ON deals;

CREATE POLICY "Admins can view all deals"
  ON deals FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── chat_messages ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all messages" ON chat_messages;

CREATE POLICY "Admins can view all messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── tasks ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;

CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── action_logs ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all action logs" ON action_logs;

CREATE POLICY "Admins can view all action logs"
  ON action_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── daemon_status ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all daemon status"   ON daemon_status;
DROP POLICY IF EXISTS "Admins can update all daemon status" ON daemon_status;

CREATE POLICY "Admins can view all daemon status"
  ON daemon_status FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all daemon status"
  ON daemon_status FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── admin_settings ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view admin settings"   ON admin_settings;
DROP POLICY IF EXISTS "Admins can update admin settings" ON admin_settings;

CREATE POLICY "Admins can view admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update admin settings"
  ON admin_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
