import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import type { OwnerRole } from '@/lib/types'

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return (data?.role_code || null) as OwnerRole | null
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userRole = await getUserRole(supabase, user.id)

  const { data: fixed } = await supabase.from('fixed_content').select('*, clients(name)').eq('id', id).single()
  if (!fixed) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Best-effort calendar cleanup
  if (fixed.calendar_event_id && fixed.calendar_id) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      try {
        await deleteCalendarEvent(fixed.calendar_id, fixed.calendar_event_id, session.provider_token, session.provider_refresh_token ?? undefined)
      } catch (e) { console.warn('Calendar delete failed:', e) }
    }
  }

  const { error } = await supabase.from('fixed_content').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clientName = (fixed as Record<string, Record<string, string>>).clients?.name || fixed.client_id
  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: userRole,
    text: `🗑 Eliminó tarea fija "<strong>${fixed.title.substring(0, 40)}</strong>" de ${clientName}`,
  })

  return NextResponse.json({ success: true })
}
