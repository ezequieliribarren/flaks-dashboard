'use client'

import type { ActivityLogEntry, TeamMember } from '@/lib/types'

interface Props {
  activityLog: ActivityLogEntry[]
  team: TeamMember[]
}

export default function ActivityLog({ activityLog, team }: Props) {
  return (
    <div className="activity-log">
      <div className="activity-header">📋 Actividad reciente</div>
      <div className="activity-list">
        {activityLog.length === 0 ? (
          <div className="activity-empty">Sin actividad todavía.</div>
        ) : (
          activityLog.slice(0, 30).map(a => {
            const member = a.user_id
              ? team.find(t => t.user_id === a.user_id)
              : team.find(t => t.role_code === a.role_code)
            const u = member || { color: '#999', initials: '?' }
            const t = a.ts
              ? new Date(a.ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
              : ''
            return (
              <div key={a.id} className="activity-item">
                <div className="activity-who" style={{ background: u.color }}>{u.initials}</div>
                {/* text can contain safe HTML (<strong>) from our own server */}
                <div className="activity-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                <div className="activity-time">{t}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
