import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/tablero'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Link team_members.user_id on first login
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const ezeEmail = process.env.EZE_EMAIL
        const gerEmail = process.env.GER_EMAIL

        let role: string | null = null
        if (user.email === ezeEmail) role = 'EZE'
        else if (user.email === gerEmail) role = 'GER'

        if (role) {
          // Only update if not already linked (avoid overwriting)
          const { data: existing } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('role_code', role)
            .single()

          if (existing && !existing.user_id) {
            await supabase
              .from('team_members')
              .update({ user_id: user.id, email: user.email })
              .eq('role_code', role)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
