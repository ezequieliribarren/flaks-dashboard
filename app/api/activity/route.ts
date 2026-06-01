import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '80', 10)
  const { data, error } = await supabase.from('activity_log').select('*').order('ts', { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
