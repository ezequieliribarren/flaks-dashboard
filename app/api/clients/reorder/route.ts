import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()
  const { order } = await request.json() as { order: string[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order must be array' }, { status: 400 })
  await Promise.all(order.map((id, i) => supabase.from('clients').update({ sort_order: i }).eq('id', id)))
  return NextResponse.json({ success: true })
}
