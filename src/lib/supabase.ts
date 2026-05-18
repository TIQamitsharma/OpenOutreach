import { createClient } from '@supabase/supabase-js'

// Using untyped client to avoid TS inference of `never` for insert/update
// operations — explicit type imports are used in each page instead.
const supabaseUrl = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
