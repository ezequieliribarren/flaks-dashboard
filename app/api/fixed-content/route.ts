import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createCalendarEvent, buildFixedDescription } from '@/lib/google-calendar'
import type { OwnerRole, FrequencyType, FixedContentType } from '@/lib/types'

const FREQ_LABELS: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }
const TYPE_ICONS: Record<string, string> = {
  historia: '📸', carrusel: '🎠', reel: '🎬', video: '🎥', post: '📝', informe: '📊', otro: '✨',
}

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return (data?.role_code || null) as OwnerRole | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_id, type, title, frequency, day_week, day_month, time, owner_role, start_date } = body as {
    client_id: string; type: FixedContentType; title: string;
    frequency: FrequencyType; day_week?: string; day_month?: string;
    time: string; owner_role: OwnerRole; start_date: string
  }

  if (!client_id || !type || !title || !frequency || !start_date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userRole = await getUserRole(supabase, user.id)
  const { data: client } = await supabase.from('clients').select('name').eq('id', client_id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Get owner's calendar_id
  const { data: ownerMember } = await supabase
    .from('team_members').select('calendar_id, name').eq('role_code', owner_role).single()
  const calendarId = ownerMember?.calendar_id
  if (!calendarId) return NextResponse.json({ error: `No calendar_id for ${owner_role}` }, { status: 400 })

  // Build RRULE
  let rrule = ''
  if (frequency === 'weekly') rrule = `RRULE:FREQ=WEEKLY;BYDAY=${day_week}`
  else if (frequency === 'biweekly') rrule = `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${day_week}`
  else if (frequency === 'monthly') rrule = `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day_month}`

  const icon = TYPE_ICONS[type] || '✨'
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
  const summary = `${icon} ${client.name} · ${typeLabel} · ${title}`

  // Build start/end (60 min duration)
  const startDT = `${start_date}T${time}:00`
  const endDate = new Date(`${start_date}T${time}:00`)
  endDate.setMinutes(endDate.getMinutes() + 60)
  const endDT = endDate.toISOString().replace('Z', '').substring(0, 19)

  let calendarEventId: string | null = null
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.provider_token) {
    try {
      const ev = await createCalendarEvent({
        summary,
        description: buildFixedDescription(client.name, client_id, typeLabel, FREQ_LABELS[frequency], ownerMember?.name || owner_role),
        startTime: startDT, endTime: endDT, calendarId,
        timeZone: 'America/Argentina/Buenos_Aires',
        recurrence: rrule ? [rrule] : undefined,
      }, session.provider_token, session.provider_refresh_token ?? undefined)
      calendarEventId = ev.id
    } catch (e) {
      console.error('Calendar error:', e)
      return NextResponse.json({ error: String(e) }, { status: 422 })
    }
  } else {
    return NextResponse.json({ error: 'No Google token available. Re-login with Google to enable Calendar.' }, { status: 422 })
  }

  const id = `fix-${client_id}-${Date.now()}`
  const { data: fixed, error } = await supabase.from('fixed_content').insert({
    id, client_id, type, title, frequency,
    day_week: frequency !== 'monthly' ? day_week : null,
    day_month: frequency === 'monthly' ? day_month : null,
    time, owner_role, start_date, calendar_event_id: calendarEventId, calendar_id: calendarId,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: userRole,
    text: `🔁 Creó tarea fija "<strong>${title.substring(0, 40)}</strong>" (${FREQ_LABELS[frequency]}) en ${client.name} para <strong>${ownerMember?.name || owner_role}</strong>`,
  })

  return NextResponse.json({ fixed }, { status: 201 })
}
