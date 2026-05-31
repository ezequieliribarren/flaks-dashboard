import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createCalendarEvent, buildEventDescription } from '@/lib/google-calendar'
import type { OwnerRole } from '@/lib/types'

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return (data?.role_code || null) as OwnerRole | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { objectiveId, date, time, durationMin = 60, ownerRole, location, notes } = body as {
    objectiveId: string; date: string; time: string; durationMin?: number;
    ownerRole: OwnerRole; location?: string; notes?: string
  }

  if (!objectiveId || !date || !time) {
    return NextResponse.json({ error: 'objectiveId, date and time are required' }, { status: 400 })
  }

  const userRole = await getUserRole(supabase, user.id)

  // Load objective + client
  const { data: obj } = await supabase
    .from('objectives')
    .select('*, clients(name, id)')
    .eq('id', objectiveId)
    .single()

  if (!obj) return NextResponse.json({ error: 'Objective not found' }, { status: 404 })

  const clientData = (obj as Record<string, Record<string, string>>).clients
  const clientName = clientData?.name || obj.client_id
  const clientId = clientData?.id || obj.client_id

  // Get owner's calendar
  const { data: ownerMember } = await supabase
    .from('team_members').select('calendar_id, name').eq('role_code', ownerRole).single()
  const calendarId = ownerMember?.calendar_id
  if (!calendarId) {
    return NextResponse.json({ error: `No calendar_id configured for role ${ownerRole}` }, { status: 400 })
  }

  // Get provider token from session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.provider_token) {
    return NextResponse.json({
      error: 'No Google token. Re-login with Google to enable Calendar integration.',
    }, { status: 422 })
  }

  // Build start/end
  const startDT = `${date}T${time}:00`
  const startDate = new Date(startDT)
  const endDate = new Date(startDate.getTime() + durationMin * 60000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const endDT = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`

  const summary = `🎯 ${clientName} · ${obj.text}`
  const description = buildEventDescription(
    clientName, clientId, obj.text, objectiveId,
    obj.type === 'monthly' ? 'Objetivo del mes' : 'Tarea',
    ownerMember?.name || ownerRole,
    obj.notes, notes
  )

  let eventId: string
  try {
    const ev = await createCalendarEvent({
      summary, description, startTime: startDT, endTime: endDT, calendarId,
      timeZone: 'America/Argentina/Buenos_Aires',
      location: location || undefined,
      reminders: [{ method: 'popup', minutes: 30 }, { method: 'popup', minutes: 1440 }],
    }, session.provider_token, session.provider_refresh_token ?? undefined)
    eventId = ev.id
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 422 })
  }

  const now = new Date().toISOString()
  await supabase.from('objectives').update({
    calendar_event_id: eventId,
    scheduled_at: startDate.toISOString(),
    scheduled_calendar_id: calendarId,
    owner_role: ownerRole,
    changed_by: user.id, changed_by_role: userRole, changed_at: now,
  }).eq('id', objectiveId)

  const localDT = startDate.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: userRole,
    text: `📅 Agendó "<strong>${obj.text.substring(0, 40)}</strong>" en Calendar de <strong>${ownerMember?.name || ownerRole}</strong> para ${localDT}`,
  })

  return NextResponse.json({ eventId, scheduledAt: startDate.toISOString() })
}
