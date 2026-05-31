import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function slugify(s: string) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 32) || 'cliente'
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function generateClientId(supabase: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name)
  let id = base
  let n = 2
  while (true) {
    const { data } = await supabase.from('clients').select('id').eq('id', id).single()
    if (!data) break
    id = `${base}-${n}`; n++
  }
  return id
}

async function getUserRole(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return data?.role_code as string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, emoji, color, rubro, contacto, ticket, pct, alert, services = [] } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const id = await generateClientId(supabase, name)
  const role = await getUserRole(supabase, user.id)

  const { data: maxRow } = await supabase
    .from('clients').select('sort_order')
    .order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (maxRow?.sort_order ?? -1) + 1

  const { data: client, error } = await supabase.from('clients').insert({
    id, name, emoji: emoji || '🏷️', color: color || '#2196F3',
    rubro: rubro || '—', contacto: contacto || '—',
    ticket: ticket || '$0', pct: pct || '0%',
    alert: alert || null, sort_order,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (services.length) {
    const svcRows = (services as Record<string, unknown>[]).map((s, i: number) => ({
      client_id: id, name: s.name, active: s.active !== false,
      note: s.note || null,
      amount: s.amount != null && s.amount !== '' ? Number(s.amount) : null,
      billing_type: s.billing_type || 'recurring',
      start_date: s.start_date || null,
      sort_order: i,
    }))
    await supabase.from('services').insert(svcRows)
  }

  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: role,
    text: `➕ Creó cliente <strong>${name}</strong>`,
  })

  return NextResponse.json({ client }, { status: 201 })
}
