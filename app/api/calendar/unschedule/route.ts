import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import type { OwnerRole } from '@/lib/types'

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return (data?.role_code || null) as OwnerRole | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { objectiveId } = await request.json() as { objectiveId: string }
  if (!objectiveId) return NextResponse.json({ error: 'objectiveId required' }, { status: 400 })

  const userRole = await getUserRole(supabase, user.id)

  const { data: obj } = await supabase
    .from('objectives').select('*, clients(name)').eq('id', objectiveId).single()
  if (!obj) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (obj.calendar_event_id && obj.scheduled_calendar_id) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      try {
        await deleteCalendarEvent(obj.scheduled_calendar_id, obj.calendar_event_id, session.provider_token, session.provider_refresh_token ?? undefined)
      } catch (e) { console.warn('Could not delete calendar event:', e) }
    }
  }

  const now = new Date().toISOString()
  await supabase.from('objectives').update({
    calendar_event_id: null,
    scheduled_at: null,
    scheduled_calendar_id: null,
    changed_by: user.id, changed_by_role: userRole, changed_at: now,
  }).eq('id', objectiveId)

  const clientName = (obj as Record<string, Record<string, string>>).clients?.name || obj.client_id
  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: userRole,
    text: `🗑 Quitó del Calendar "<strong>${obj.text.substring(0, 40)}</strong>" en ${clientName}`,
  })

  return NextResponse.json({ success: true })
}
