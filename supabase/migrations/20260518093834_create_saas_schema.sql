/*
  # OpenOutreach SaaS Schema

  ## Overview
  Full multi-tenant SaaS schema for OpenOutreach. Converts the single-user
  Django SQLite setup into a multi-tenant Supabase PostgreSQL schema.

  ## New Tables
  1. `user_profiles` - Extended user profile (plan, onboarding status, display name)
  2. `subscriptions` - Razorpay subscription tracking per user
  3. `user_configs` - Per-user BYOK settings (LLM provider/key, LinkedIn creds)
  4. `campaigns` - LinkedIn outreach campaigns (owned by user)
  5. `leads` - LinkedIn profiles discovered (tenant-scoped)
  6. `deals` - Campaign-scoped lead state machine
  7. `chat_messages` - LinkedIn conversation messages
  8. `tasks` - Persistent automation task queue
  9. `action_logs` - Rate-limiting audit trail
  10. `search_keywords` - Per-campaign search keyword cache
  11. `daemon_status` - Per-user worker process health
  12. `admin_settings` - Global platform admin settings

  ## Security
  - RLS enabled on ALL tables
  - Users can only access their own data
  - Admin role checked via user_profiles.role
*/

-- ─── user_profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  onboarding_completed boolean NOT NULL DEFAULT false,
  legal_accepted boolean NOT NULL DEFAULT false,
  legal_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  razorpay_subscription_id text UNIQUE,
  razorpay_customer_id text,
  razorpay_plan_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'authenticated', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── user_configs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  llm_provider text NOT NULL DEFAULT 'openai' CHECK (llm_provider IN ('openai', 'anthropic', 'google', 'groq', 'mistral', 'cohere', 'openai_compatible')),
  llm_api_key text DEFAULT '',
  llm_api_base text DEFAULT '',
  ai_model text DEFAULT '',
  linkedin_username text DEFAULT '',
  linkedin_password_enc text DEFAULT '',
  connect_daily_limit integer NOT NULL DEFAULT 20 CHECK (connect_daily_limit >= 1 AND connect_daily_limit <= 50),
  connect_weekly_limit integer NOT NULL DEFAULT 100 CHECK (connect_weekly_limit >= 1 AND connect_weekly_limit <= 300),
  follow_up_daily_limit integer NOT NULL DEFAULT 25 CHECK (follow_up_daily_limit >= 1 AND follow_up_daily_limit <= 100),
  active_hours_enabled boolean NOT NULL DEFAULT false,
  active_start_hour integer NOT NULL DEFAULT 9 CHECK (active_start_hour >= 0 AND active_start_hour <= 23),
  active_end_hour integer NOT NULL DEFAULT 19 CHECK (active_end_hour >= 0 AND active_end_hour <= 23),
  active_timezone text NOT NULL DEFAULT 'UTC',
  rest_days integer[] NOT NULL DEFAULT ARRAY[5, 6],
  llm_key_validated boolean NOT NULL DEFAULT false,
  linkedin_creds_validated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own config"
  ON user_configs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own config"
  ON user_configs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own config"
  ON user_configs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all configs"
  ON user_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── campaigns ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  product_docs text DEFAULT '',
  campaign_objective text DEFAULT '',
  booking_link text DEFAULT '',
  is_freemium boolean NOT NULL DEFAULT false,
  action_fraction float NOT NULL DEFAULT 0.2,
  seed_public_ids jsonb NOT NULL DEFAULT '[]',
  model_blob bytea,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  linkedin_url text NOT NULL,
  public_identifier text NOT NULL,
  urn text,
  disqualified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, public_identifier)
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);
CREATE INDEX IF NOT EXISTS leads_public_identifier_idx ON leads(public_identifier);

CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── deals ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'QUALIFIED' CHECK (state IN ('QUALIFIED','READY_TO_CONNECT','PENDING','CONNECTED','COMPLETED','FAILED')),
  outcome text NOT NULL DEFAULT '' CHECK (outcome IN ('','converted','not_interested','wrong_fit','no_budget','has_solution','bad_timing','unresponsive','unknown')),
  reason text NOT NULL DEFAULT '',
  connect_attempts integer NOT NULL DEFAULT 0,
  backoff_hours integer NOT NULL DEFAULT 0,
  profile_summary jsonb,
  chat_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, campaign_id)
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS deals_user_id_idx ON deals(user_id);
CREATE INDEX IF NOT EXISTS deals_campaign_id_idx ON deals(campaign_id);
CREATE INDEX IF NOT EXISTS deals_state_idx ON deals(state);

CREATE POLICY "Users can view own deals"
  ON deals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── chat_messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  is_outgoing boolean NOT NULL DEFAULT true,
  linkedin_urn text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS chat_messages_deal_id_idx ON chat_messages(deal_id);
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);

CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── tasks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  task_type text NOT NULL CHECK (task_type IN ('connect', 'check_pending', 'follow_up')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}',
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tasks_user_id_status_idx ON tasks(user_id, status, scheduled_at);

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── action_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('connect', 'follow_up')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS action_logs_user_action_created_idx ON action_logs(user_id, action_type, created_at);

CREATE POLICY "Users can view own action logs"
  ON action_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all action logs"
  ON action_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── search_keywords ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, keyword)
);

ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keywords"
  ON search_keywords FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all keywords"
  ON search_keywords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── daemon_status ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daemon_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'stopped' CHECK (status IN ('stopped', 'starting', 'running', 'paused', 'error')),
  pid integer,
  last_heartbeat timestamptz,
  last_error text,
  last_task_type text,
  last_task_at timestamptz,
  queue_depth integer NOT NULL DEFAULT 0,
  total_connects integer NOT NULL DEFAULT 0,
  total_follow_ups integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daemon_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daemon status"
  ON daemon_status FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daemon status"
  ON daemon_status FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daemon status"
  ON daemon_status FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all daemon status"
  ON daemon_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all daemon status"
  ON daemon_status FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── admin_settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razorpay_key_id text DEFAULT '',
  razorpay_key_secret text DEFAULT '',
  plan_limits jsonb NOT NULL DEFAULT '{
    "free":     {"campaigns": 1, "daily_connects": 10, "weekly_connects": 50, "follow_ups": 10, "max_accounts": 1},
    "starter":  {"campaigns": 3, "daily_connects": 20, "weekly_connects": 100, "follow_ups": 25, "max_accounts": 1},
    "pro":      {"campaigns": 10, "daily_connects": 35, "weekly_connects": 200, "follow_ups": 50, "max_accounts": 3},
    "business": {"campaigns": 999, "daily_connects": 50, "weekly_connects": 300, "follow_ups": 100, "max_accounts": 10}
  }',
  maintenance_mode boolean NOT NULL DEFAULT false,
  announcement text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write global settings
CREATE POLICY "Admins can view admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin settings"
  ON admin_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ─── Seed admin settings row ──────────────────────────────────────────────────
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ─── Auto-create user_profile on signup ──────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── updated_at auto-touch ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_user_profiles_updated_at') THEN
    CREATE TRIGGER touch_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_subscriptions_updated_at') THEN
    CREATE TRIGGER touch_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_user_configs_updated_at') THEN
    CREATE TRIGGER touch_user_configs_updated_at BEFORE UPDATE ON user_configs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_campaigns_updated_at') THEN
    CREATE TRIGGER touch_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_deals_updated_at') THEN
    CREATE TRIGGER touch_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END $$;
