import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return data?.role_code as string | null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const role = await getUserRole(supabase, user.id)

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

  // Replace services if provided
  if (services !== undefined) {
    await supabase.from('services').delete().eq('client_id', id)
    if (services.length) {
      const svcRows = services.map((s: Record<string, unknown>, i: number) => ({
        client_id: id, name: s.name, active: s.active !== false,
        note: s.note || null, amount: s.amount != null ? Number(s.amount) : null,
        billing_type: s.billing_type || 'recurring', start_date: s.start_date || null,
        sort_order: i,
      }))
      await supabase.from('services').insert(svcRows)
    }
  }

  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: role,
    text: `✏️ Editó cliente <strong>${name || id}</strong>`,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = await getUserRole(supabase, user.id)

  const { data: client } = await supabase.from('clients').select('name').eq('id', id).single()
  const name = client?.name || id

  // Cascade: services, objectives, fixed_content are deleted via FK CASCADE
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: role,
    text: `🗑 Eliminó cliente <strong>${name}</strong>`,
  })

  return NextResponse.json({ success: true })
}
