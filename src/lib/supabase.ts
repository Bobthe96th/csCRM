import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iiffkzrslzkqwnmebffp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_F7oOUzL_Wjk51P_GBDcA3Q_lB2QZ_mg'

console.log('Supabase URL:', supabaseUrl)
if (supabaseAnonKey) {
  console.log('Supabase Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...')
} else {
  console.log('Supabase Anon Key: Not provided')
}

// Create Supabase client with proper error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types for our database schema
export interface WhatsAppMessage {
  id: number
  sender_number: string
  message_text: string
  direction: 'inbound' | 'outbound'
  agent: 'AI' | 'Human'
  status: 'open' | 'closed' | 'pending'
  created_at: string
  updated_at: string
}

export interface Conversation {
  sender_number: string
  last_message: string
  last_message_time: string
  unread_count: number
  status: 'open' | 'closed' | 'pending'
} 

// User management types
export type UserRole = 'admin' | 'agent'

export interface AppUser {
  id: number
  display_name: string
  email?: string
  phone?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Capability {
  id: number
  key: string
  description?: string
}

export interface RoleCapability {
  id: number
  role: UserRole
  capability_id: number
}

export interface UserCapability {
  id: number
  user_id: number
  capability_id: number
}