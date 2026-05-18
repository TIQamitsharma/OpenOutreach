/*
  # Fix Function Security Issues

  1. touch_updated_at — set a fixed search_path to prevent mutable search_path attacks
  2. handle_new_user — revoke EXECUTE from anon and authenticated roles to prevent
     public/signed-in users from calling a SECURITY DEFINER function via the REST API
*/

-- Fix mutable search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user: set fixed search_path and revoke public execute
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Revoke EXECUTE on handle_new_user from roles that shouldn't call it directly.
-- It must remain callable by the trigger (which runs as the table owner),
-- but should not be invocable via the PostgREST /rpc endpoint.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
