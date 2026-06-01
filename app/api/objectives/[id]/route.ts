import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { deleteCalendarEvent } from '@/lib/google-calendar'

const STATUS_CYCLE = ['pending', 'progress', 'done', 'blocked', 'pending']
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', progress: 'En curso', done: 'Logrado', blocked: 'Bloqueado',
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params
  const body = await request.json()
  const now = new Date().toISOString()

  const { data: current } = await supabase.from('objectives').select('*, clients(name)').eq('id', id).single()
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, unknown> = { changed_by_role: 'EZE', changed_at: now }
  let logText = ''

  if (body.action === 'cycle_status') {
    const prevStatus = current.status
    const idx = STATUS_CYCLE.indexOf(prevStatus)
    const newStatus = STATUS_CYCLE[(idx + 1) % (STATUS_CYCLE.length - 1)]
    updates.status = newStatus
    const clientName = (current as Record<string, Record<string, string>>).clients?.name || current.client_id
    logText = `Cambió "<strong>${current.text.substring(0, 40)}</strong>" de ${STATUS_LABELS[prevStatus]} → <strong>${STATUS_LABELS[newStatus]}</strong> en ${clientName}`
  } else {
    if (body.text !== undefined) {
      const prevText = current.text
      updates.text = body.text
      logText = `✏️ Editó objetivo "${prevText !== body.text ? `<strong>${prevText.substring(0, 40)}</strong>" → ` : ''}"<strong>${body.text.substring(0, 40)}</strong>"`
    }
    if (body.notes !== undefined) updates.notes = body.notes || null
    if (body.status !== undefined) updates.status = body.status
    if (body.owner_role !== undefined) updates.owner_role = body.owner_role
    if (body.calendar_event_id !== undefined) updates.calendar_event_id = body.calendar_event_id
    if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at
    if (body.scheduled_calendar_id !== undefined) updates.scheduled_calendar_id = body.scheduled_calendar_id
  }

  const { error } = await supabase.from('objectives').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (logText) await supabase.from('activity_log').insert({ role_code: 'EZE', text: logText })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params

  const { data: obj } = await supabase.from('objectives').select('*, clients(name)').eq('id', id).single()
  if (!obj) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Best-effort calendar cleanup (requires Google token - skipped without auth)
  const { error } = await supabase.from('objectives').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clientName = (obj as Record<string, Record<string, string>>).clients?.name || obj.client_id
  await supabase.from('activity_log').insert({
    role_code: 'EZE',
    text: `Eliminó el objetivo "<strong>${obj.text.substring(0, 40)}</strong>" de ${clientName}`,
  })
  return NextResponse.json({ success: true })
}
