import { createClient } from '@supabase/supabase-js'

// Solo para scripts de servidor (migration, etc.)
// NUNCA usar en route handlers – usar el cliente SSR en su lugar
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
