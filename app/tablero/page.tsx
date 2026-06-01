import { createAdminClient } from '@/lib/supabase/admin'
import Dashboard from '@/components/Dashboard'
import type { Snapshot, TeamMember, Objective, FixedContent, Service } from '@/lib/types'

async function fetchSnapshot(): Promise<Snapshot> {
  const supabase = createAdminClient()

  const [clientsRes, activityRes, teamRes] = await Promise.all([
    supabase
      .from('clients')
      .select('*, services(*), objectives(*), fixed_content(*)')
      .order('sort_order', { ascending: true }),
    supabase.from('activity_log').select('*').order('ts', { ascending: false }).limit(80),
    supabase.from('team_members').select('*'),
  ])

  type RawClient = {
    services: Service[]
    objectives: Objective[]
    fixed_content: FixedContent[]
    [k: string]: unknown
  }

  function sortByScheduledAt(a: Objective, b: Objective) {
    const aT = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity
    const bT = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity
    return aT - bT
  }

  const clients = ((clientsRes.data || []) as RawClient[]).map(c => ({
    ...(c as Omit<RawClient, 'objectives' | 'fixed_content'>),
    services: [...(c.services || [])].sort((a, b) => a.sort_order - b.sort_order),
    tasks: [...(c.objectives || []).filter(o => o.type === 'task')].sort(sortByScheduledAt),
    monthlyObjectives: [...(c.objectives || []).filter(o => o.type === 'monthly')].sort(sortByScheduledAt),
    fixedContent: c.fixed_content || [],
  })) as Snapshot['clients']

  return {
    clients,
    activityLog: activityRes.data || [],
    team: (teamRes.data || []) as TeamMember[],
  }
}

export default async function TablreoPage() {
  const snapshot = await fetchSnapshot()
  // TEMP: sin auth, mostramos sin usuario logueado
  return <Dashboard initialSnapshot={snapshot} currentTeamMember={null} />
}
