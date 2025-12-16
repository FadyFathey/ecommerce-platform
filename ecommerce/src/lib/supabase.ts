import { createClient } from '@supabase/supabase-js'
import { createRememberMeStorage } from './storage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with custom storage that respects "Remember me"
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createRememberMeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})



