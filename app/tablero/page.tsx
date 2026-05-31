import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import type { Snapshot, TeamMember } from '@/lib/types'

async function fetchSnapshot(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Snapshot> {
  const [clientsRes, activityRes, teamRes] = await Promise.all([
    supabase
      .from('clients')
      .select('*, services(*), objectives(*), fixed_content(*)')
      .order('sort_order', { ascending: true }),
    supabase.from('activity_log').select('*').order('ts', { ascending: false }).limit(80),
    supabase.from('team_members').select('*'),
  ])

  type RawClient = {
    services: import('@/lib/types').Service[]
    objectives: import('@/lib/types').Objective[]
    fixed_content: import('@/lib/types').FixedContent[]
    [k: string]: unknown
  }

  function sortByScheduledAt(a: import('@/lib/types').Objective, b: import('@/lib/types').Objective) {
    const aT = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
    const bT = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
    return aT - bT
  }

  const clients = ((clientsRes.data || []) as RawClient[]).map(c => ({
    ...(c as Omit<RawClient, 'objectives' | 'fixed_content'>),
    services: [...(c.services || [])].sort((a, b) => a.sort_order - b.sort_order),
    tasks: [...(c.objectives || []).filter((o: import('@/lib/types').Objective) => o.type === 'task')].sort(sortByScheduledAt),
    monthlyObjectives: [...(c.objectives || []).filter((o: import('@/lib/types').Objective) => o.type === 'monthly')].sort(sortByScheduledAt),
    fixedContent: c.fixed_content || [],
  })) as Snapshot['clients']

  return {
    clients,
    activityLog: activityRes.data || [],
    team: (teamRes.data || []) as TeamMember[],
  }
}

export default async function TablreoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const snapshot = await fetchSnapshot(supabase)
  const currentTeamMember = snapshot.team.find(t => t.user_id === user.id) || null

  return <Dashboard initialSnapshot={snapshot} currentTeamMember={currentTeamMember} />
}
