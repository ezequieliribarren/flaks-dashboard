import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_id, name, active, note, amount, billing_type, start_date } = body
  if (!client_id || !name) return NextResponse.json({ error: 'client_id and name required' }, { status: 400 })

  const { data: maxRow } = await supabase
    .from('services').select('sort_order')
    .eq('client_id', client_id)
    .order('sort_order', { ascending: false }).limit(1).single()
  const sort_order = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await supabase.from('services').insert({
    client_id, name, active: active !== false,
    note: note || null, amount: amount != null ? Number(amount) : null,
    billing_type: billing_type || 'recurring', start_date: start_date || null, sort_order,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data }, { status: 201 })
}
