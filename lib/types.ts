export type BillingType = 'recurring' | 'one-time' | 'included'
export type ObjectiveType = 'task' | 'monthly'
export type ObjectiveStatus = 'pending' | 'progress' | 'done' | 'blocked'
export type OwnerRole = 'EZE' | 'GER' | 'AMBOS'
export type FixedContentType = 'historia' | 'carrusel' | 'reel' | 'video' | 'post' | 'informe' | 'otro'
export type FrequencyType = 'weekly' | 'biweekly' | 'monthly'

export interface Client {
  id: string
  name: string
  emoji: string
  color: string
  rubro: string
  contacto: string
  ticket: string
  pct: string
  alert: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  client_id: string
  name: string
  active: boolean
  note: string | null
  amount: number | null
  billing_type: BillingType
  start_date: string | null
  sort_order: number
}

export interface Objective {
  id: string
  client_id: string
  type: ObjectiveType
  text: string
  notes: string | null
  owner_role: OwnerRole
  status: ObjectiveStatus
  scheduled_at: string | null
  scheduled_calendar_id: string | null
  calendar_event_id: string | null
  changed_by: string | null
  changed_by_role: OwnerRole | null
  changed_at: string | null
  created_at: string
}

export interface FixedContent {
  id: string
  client_id: string
  type: FixedContentType
  title: string
  frequency: FrequencyType
  day_week: string | null
  day_month: string | null
  time: string
  owner_role: OwnerRole
  start_date: string | null
  calendar_event_id: string | null
  calendar_id: string | null
  created_by: string | null
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  user_id: string | null
  role_code: string | null
  text: string
  ts: string
}

export interface TeamMember {
  id: string
  user_id: string | null
  role_code: string
  name: string
  color: string
  initials: string
  calendar_id: string | null
  email: string | null
}

export interface ClientWithAll extends Client {
  services: Service[]
  tasks: Objective[]
  monthlyObjectives: Objective[]
  fixedContent: FixedContent[]
}

export interface Snapshot {
  clients: ClientWithAll[]
  activityLog: ActivityLogEntry[]
  team: TeamMember[]
}
