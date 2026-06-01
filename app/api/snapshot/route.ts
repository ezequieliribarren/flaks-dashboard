import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { Client, Service, Objective, FixedContent, ActivityLogEntry, TeamMember, ClientWithAll } from '@/lib/types'

function sortByScheduledAt(a: Objective, b: Objective) {
  const aT = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
  const bT = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
  return aT - bT
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const [clientsRes, activityRes, teamRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*, services(*), objectives(*), fixed_content(*)')
        .order('sort_order', { ascending: true }),
      supabase.from('activity_log').select('*').order('ts', { ascending: false }).limit(80),
      supabase.from('team_members').select('*'),
    ])

    if (clientsRes.error) throw clientsRes.error

    type RawClient = Client & { services: Service[]; objectives: Objective[]; fixed_content: FixedContent[] }
    const clients: ClientWithAll[] = ((clientsRes.data || []) as RawClient[]).map(c => ({
      ...c,
      services: [...(c.services || [])].sort((a, b) => a.sort_order - b.sort_order),
      tasks: [...(c.objectives || []).filter(o => o.type === 'task')].sort(sortByScheduledAt),
      monthlyObjectives: [...(c.objectives || []).filter(o => o.type === 'monthly')].sort(sortByScheduledAt),
      fixedContent: c.fixed_content || [],
    }))

    return NextResponse.json({
      clients,
      activityLog: (activityRes.data || []) as ActivityLogEntry[],
      team: (teamRes.data || []) as TeamMember[],
    })
  } catch (err) {
    console.error('GET /api/snapshot error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
