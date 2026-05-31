import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { OwnerRole, ObjectiveType } from '@/lib/types'

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('team_members').select('role_code').eq('user_id', userId).single()
  return (data?.role_code || null) as OwnerRole | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_id, type, text, notes, owner_role } = body as {
    client_id: string; type: ObjectiveType; text: string; notes?: string; owner_role?: OwnerRole
  }

  if (!client_id || !type || !text) {
    return NextResponse.json({ error: 'client_id, type and text required' }, { status: 400 })
  }

  const role = await getUserRole(supabase, user.id)
  const prefix = type === 'task' ? `${client_id}-m` : `${client_id}-q`
  const id = `${prefix}${Date.now()}`
  const now = new Date().toISOString()

  const { data: obj, error } = await supabase.from('objectives').insert({
    id, client_id, type, text, notes: notes || null,
    owner_role: owner_role || role || 'EZE',
    status: 'pending',
    changed_by: user.id, changed_by_role: role, changed_at: now,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: client } = await supabase.from('clients').select('name').eq('id', client_id).single()
  await supabase.from('activity_log').insert({
    user_id: user.id, role_code: role,
    text: `Agregó nuevo objetivo "<strong>${text.substring(0, 40)}</strong>" a ${client?.name || client_id}`,
  })

  return NextResponse.json({ objective: obj }, { status: 201 })
}
