import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function slugify(s: string) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 32) || 'cliente'
}

type AdminClient = ReturnType<typeof createAdminClient>

async function generateClientId(supabase: AdminClient, name: string): Promise<string> {
  const base = slugify(name)
  let id = base, n = 2
  while (true) {
    const { data } = await supabase.from('clients').select('id').eq('id', id).single()
    if (!data) break
    id = `${base}-${n}`; n++
  }
  return id
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { name, emoji, color, rubro, contacto, ticket, pct, alert, services = [] } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const id = await generateClientId(supabase, name)
  const { data: maxRow } = await supabase.from('clients').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (maxRow?.sort_order ?? -1) + 1

  const { data: client, error } = await supabase.from('clients').insert({
    id, name, emoji: emoji || '🏷️', color: color || '#2196F3',
    rubro: rubro || '—', contacto: contacto || '—',
    ticket: ticket || '$0', pct: pct || '0%', alert: alert || null, sort_order,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (services.length) {
    const svcRows = (services as Record<string, unknown>[]).map((s, i) => ({
      client_id: id, name: s.name, active: s.active !== false,
      note: s.note || null,
      amount: s.amount != null && s.amount !== '' ? Number(s.amount) : null,
      billing_type: s.billing_type || 'recurring', start_date: s.start_date || null, sort_order: i,
    }))
    await supabase.from('services').insert(svcRows)
  }

  await supabase.from('activity_log').insert({ role_code: 'EZE', text: `➕ Creó cliente <strong>${name}</strong>` })
  return NextResponse.json({ client }, { status: 201 })
}
