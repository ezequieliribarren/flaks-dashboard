import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params
  const body = await request.json()
  const { name, emoji, color, rubro, contacto, ticket, pct, alert, services } = body

  const updatePayload: Record<string, unknown> = {}
  if (name !== undefined) updatePayload.name = name
  if (emoji !== undefined) updatePayload.emoji = emoji
  if (color !== undefined) updatePayload.color = color
  if (rubro !== undefined) updatePayload.rubro = rubro
  if (contacto !== undefined) updatePayload.contacto = contacto
  if (ticket !== undefined) updatePayload.ticket = ticket
  if (pct !== undefined) updatePayload.pct = pct
  if (alert !== undefined) updatePayload.alert = alert || null

  const { error } = await supabase.from('clients').update(updatePayload).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (services !== undefined) {
    await supabase.from('services').delete().eq('client_id', id)
    if (services.length) {
      const svcRows = (services as Record<string, unknown>[]).map((s, i) => ({
        client_id: id, name: s.name, active: s.active !== false,
        note: s.note || null,
        amount: s.amount != null && s.amount !== '' ? Number(s.amount) : null,
        billing_type: s.billing_type || 'recurring', start_date: s.start_date || null, sort_order: i,
      }))
      await supabase.from('services').insert(svcRows)
    }
  }

  await supabase.from('activity_log').insert({ role_code: 'EZE', text: `✏️ Editó cliente <strong>${name || id}</strong>` })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params
  const { data: client } = await supabase.from('clients').select('name').eq('id', id).single()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.from('activity_log').insert({ role_code: 'EZE', text: `🗑 Eliminó cliente <strong>${client?.name || id}</strong>` })
  return NextResponse.json({ success: true })
}
