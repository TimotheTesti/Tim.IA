import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Use in API routes with the user's JWT so RLS applies (auth.uid()). */
export function createSupabaseUserClient(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || !accessToken) return null
  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
