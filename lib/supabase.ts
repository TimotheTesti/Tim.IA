import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: ReturnType<typeof createClient> | null = null

// Only throw error if we're in a client context and env vars are missing
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export function getSupabase() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}

export { supabase }

// Types for database tables
export interface User {
  id: string
  email: string
  username?: string
  avatar_url?: string
  theme: 'light' | 'dark'
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  description?: string
  is_public: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  image_urls: string[]
  audio_url?: string
  file_urls: string[]
  created_at: string
  updated_at: string
}

export interface FileRecord {
  id: string
  user_id: string
  message_id?: string
  file_url: string
  file_name: string
  file_size?: number
  file_type?: string
  mime_type?: string
  created_at: string
}

export interface SuggestedPrompt {
  id: string
  title: string
  description?: string
  prompt: string
  category?: string
  icon_emoji?: string
  is_active: boolean
  created_at: string
}

export interface UserMemoryEntry {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}
