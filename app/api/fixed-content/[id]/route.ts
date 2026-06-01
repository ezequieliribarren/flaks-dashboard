import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params

  const { data: fixed } = await supabase.from('fixed_content').select('*, clients(name)').eq('id', id).single()
  if (!fixed) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('fixed_content').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clientName = (fixed as Record<string, Record<string, string>>).clients?.name || fixed.client_id
  await supabase.from('activity_log').insert({
    role_code: 'EZE',
    text: `🗑 Eliminó tarea fija "<strong>${fixed.title.substring(0, 40)}</strong>" de ${clientName}`,
  })
  return NextResponse.json({ success: true })
}
