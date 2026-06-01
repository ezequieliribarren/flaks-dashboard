import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { ObjectiveType, OwnerRole } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const body = await request.json()
  const { client_id, type, text, notes, owner_role } = body as {
    client_id: string; type: ObjectiveType; text: string; notes?: string; owner_role?: OwnerRole
  }
  if (!client_id || !type || !text) return NextResponse.json({ error: 'client_id, type and text required' }, { status: 400 })

  const prefix = type === 'task' ? `${client_id}-m` : `${client_id}-q`
  const id = `${prefix}${Date.now()}`
  const now = new Date().toISOString()

  const { data: obj, error } = await supabase.from('objectives').insert({
    id, client_id, type, text, notes: notes || null,
    owner_role: owner_role || 'EZE', status: 'pending',
    changed_by_role: 'EZE', changed_at: now,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: client } = await supabase.from('clients').select('name').eq('id', client_id).single()
  await supabase.from('activity_log').insert({
    role_code: 'EZE',
    text: `Agregó nuevo objetivo "<strong>${text.substring(0, 40)}</strong>" a ${client?.name || client_id}`,
  })

  return NextResponse.json({ objective: obj }, { status: 201 })
}
