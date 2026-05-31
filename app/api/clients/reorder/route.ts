import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { order } = await request.json() as { order: string[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order must be array' }, { status: 400 })

  // Update each client's sort_order
  await Promise.all(
    order.map((id, i) => supabase.from('clients').update({ sort_order: i }).eq('id', id))
  )

  return NextResponse.json({ success: true })
}
