'use client'

import type { Objective, TeamMember } from '@/lib/types'

const STATUS_ICONS: Record<string, string> = { pending: '', progress: '→', done: '✓', blocked: '!' }

function fmtDateTimeShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
function fmtTimeFromIso(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
function getOwnerBadgeCls(o: string) {
  if (o === 'EZE') return 'badge-eze'
  if (o === 'GER') return 'badge-ger'
  return 'badge-ambos'
}

function dueClass(obj: Objective) {
  if (!obj.scheduled_at || obj.status === 'done') return ''
  const now = Date.now()
  const diff = new Date(obj.scheduled_at).getTime() - now
  const ONE_DAY = 86400000
  if (diff < ONE_DAY) return ' due-red'
  if (diff < 7 * ONE_DAY) return ' due-yellow'
  return ' due-green'
}

interface Props {
  obj: Objective
  clientId: string
  team: TeamMember[]
  onCycleStatus: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSchedule: (id: string) => void
  onUnschedule: (id: string) => void
}

export default function ObjectiveItem({ obj, clientId, team, onCycleStatus, onEdit, onDelete, onSchedule, onUnschedule }: Props) {
  const changer = obj.changed_by
    ? team.find(t => t.user_id === obj.changed_by)
    : team.find(t => t.role_code === obj.changed_by_role)

  return (
    <div className={`obj-item${dueClass(obj)}`}>
      <div className={`obj-status ${obj.status}`} onClick={() => onCycleStatus(obj.id)} title="Click para cambiar estado">
        {STATUS_ICONS[obj.status]}
      </div>
      <div className="obj-content">
        <div className={`obj-title ${obj.status === 'done' ? 'done-text' : ''}`}>{obj.text}</div>
        {obj.notes?.trim() && <div className="obj-notes">{obj.notes}</div>}
        <div className="obj-byline">
          {changer ? (
            <>
              <span className="who-badge" style={{ background: changer.color }}>{changer.initials}</span>
              {changer.name} · {fmtTimeFromIso(obj.changed_at)}
            </>
          ) : 'Sin cambios aún'}
        </div>
        {obj.calendar_event_id && obj.scheduled_at && (
          <div className="scheduled-badge" onClick={() => onUnschedule(obj.id)} title="Click para quitar del Calendar">
            📅 {fmtDateTimeShort(obj.scheduled_at)}
          </div>
        )}
      </div>
      <div className={`obj-badge ${getOwnerBadgeCls(obj.owner_role)}`}>{obj.owner_role}</div>
      <div className="obj-actions">
        <button className="mini-btn edit-btn" onClick={() => onEdit(obj.id)} title="Editar">✏️</button>
        <button className="mini-btn schedule-btn" onClick={() => onSchedule(obj.id)} title="Agendar en Calendar">📅</button>
        <button className="mini-btn delete-btn" onClick={() => onDelete(obj.id)} title="Eliminar">×</button>
      </div>
    </div>
  )
}
