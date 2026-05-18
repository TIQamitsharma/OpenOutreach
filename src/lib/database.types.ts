export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'user' | 'admin'
          plan: 'free' | 'starter' | 'pro' | 'business'
          plan_status: 'active' | 'cancelled' | 'past_due' | 'trialing'
          onboarding_completed: boolean
          legal_accepted: boolean
          legal_accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & { id: string; email: string }
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          razorpay_subscription_id: string | null
          razorpay_customer_id: string | null
          razorpay_plan_id: string | null
          plan: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
      user_configs: {
        Row: {
          id: string
          user_id: string
          llm_provider: string
          llm_api_key: string
          llm_api_base: string
          ai_model: string
          linkedin_username: string
          linkedin_password_enc: string
          connect_daily_limit: number
          connect_weekly_limit: number
          follow_up_daily_limit: number
          active_hours_enabled: boolean
          active_start_hour: number
          active_end_hour: number
          active_timezone: string
          rest_days: number[]
          llm_key_validated: boolean
          linkedin_creds_validated: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_configs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_configs']['Row']>
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          product_docs: string
          campaign_objective: string
          booking_link: string
          is_freemium: boolean
          action_fraction: number
          seed_public_ids: Json
          model_blob: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Row']>
      }
      leads: {
        Row: {
          id: string
          user_id: string
          linkedin_url: string
          public_identifier: string
          urn: string | null
          disqualified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Row']>
      }
      deals: {
        Row: {
          id: string
          user_id: string
          lead_id: string
          campaign_id: string
          state: 'QUALIFIED' | 'READY_TO_CONNECT' | 'PENDING' | 'CONNECTED' | 'COMPLETED' | 'FAILED'
          outcome: string
          reason: string
          connect_attempts: number
          backoff_hours: number
          profile_summary: Json | null
          chat_summary: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['deals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['deals']['Row']>
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          deal_id: string
          lead_id: string
          content: string
          is_outgoing: boolean
          linkedin_urn: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Row']>
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          campaign_id: string | null
          task_type: 'connect' | 'check_pending' | 'follow_up'
          status: 'pending' | 'running' | 'completed' | 'failed'
          scheduled_at: string
          payload: Json
          error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Row']>
      }
      action_logs: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          action_type: 'connect' | 'follow_up'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['action_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
      daemon_status: {
        Row: {
          id: string
          user_id: string
          status: 'stopped' | 'starting' | 'running' | 'paused' | 'error'
          pid: number | null
          last_heartbeat: string | null
          last_error: string | null
          last_task_type: string | null
          last_task_at: string | null
          queue_depth: number
          total_connects: number
          total_follow_ups: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['daemon_status']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['daemon_status']['Row']>
      }
      admin_settings: {
        Row: {
          id: number
          razorpay_key_id: string
          razorpay_key_secret: string
          plan_limits: Json
          maintenance_mode: boolean
          announcement: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['admin_settings']['Row']>
        Update: Partial<Database['public']['Tables']['admin_settings']['Row']>
      }
    }
  }
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserConfig = Database['public']['Tables']['user_configs']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type DaemonStatus = Database['public']['Tables']['daemon_status']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
