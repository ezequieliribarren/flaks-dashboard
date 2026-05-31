'use client'

import type { FixedContent, TeamMember } from '@/lib/types'

const FIXED_TYPE_ICONS: Record<string, string> = {
  historia: '📸', carrusel: '🎠', reel: '🎬',
  video: '🎥', post: '📝', informe: '📊', otro: '✨',
}
const FREQ_LABELS: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }
const DAY_NAMES: Record<string, string> = { MO: 'Lunes', TU: 'Martes', WE: 'Miércoles', TH: 'Jueves', FR: 'Viernes', SA: 'Sábado', SU: 'Domingo' }

function getOwnerBadgeCls(o: string) {
  if (o === 'EZE') return 'badge-eze'
  if (o === 'GER') return 'badge-ger'
  return 'badge-ambos'
}

interface Props {
  fixedContent: FixedContent[]
  clientId: string
  team: TeamMember[]
  onAdd: () => void
  onDelete: (id: string) => void
}

export default function FixedContentSection({ fixedContent, clientId, team, onAdd, onDelete }: Props) {
  return (
    <div className="fixed-section">
      <div className="obj-section-title">
        <span>🔁 Tareas fijas recurrentes</span>
        <button className="add-btn" onClick={onAdd}>+ Agregar</button>
      </div>
      {fixedContent.length === 0 ? (
        <div className="empty-obj">Sin tareas fijas todavía — clic en + para agregar</div>
      ) : (
        <div className="fixed-list">
          {fixedContent.map(f => {
            const ownerMember = team.find(t => t.role_code === f.owner_role)
            const dayLabel = f.frequency === 'monthly'
              ? `día ${f.day_month}`
              : DAY_NAMES[f.day_week || ''] || f.day_week || ''
            const meta = `${FREQ_LABELS[f.frequency] || f.frequency} · ${dayLabel} · ${f.time}`
            const icon = FIXED_TYPE_ICONS[f.type] || '✨'
            return (
              <div key={f.id} className="fixed-item">
                <div className="fixed-icon">{icon}</div>
                <div className="fixed-content-inner">
                  <div className="fixed-title">{f.title}</div>
                  <div className="fixed-meta">
                    {meta}
                    {ownerMember && (
                      <>
                        {' · '}
                        <span className="who-badge" style={{ background: ownerMember.color, display: 'inline-block' }}>
                          {ownerMember.initials}
                        </span>
                        {' '}{ownerMember.name}
                      </>
                    )}
                  </div>
                </div>
                <div className={`obj-badge ${getOwnerBadgeCls(f.owner_role)}`}>{f.owner_role}</div>
                <div className="obj-actions">
                  <button className="mini-btn delete-btn" onClick={() => onDelete(f.id)} title="Eliminar serie">×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
