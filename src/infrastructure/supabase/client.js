import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || 'https://whkqdusoowrrhtvejrie.supabase.co').replace(/\/+$/, '')
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

/** Publishable client only. Server-side policies enforce every mutation. */
export const supabase = key ? createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
}) : null

export const adminLoginEmail = import.meta.env.VITE_DORTIS_ADMIN_EMAIL || ''
