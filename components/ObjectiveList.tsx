'use client'

import type { Objective, TeamMember, ObjectiveType } from '@/lib/types'
import ObjectiveItem from './ObjectiveItem'

interface Props {
  objectives: Objective[]
  clientId: string
  type: ObjectiveType
  team: TeamMember[]
  onCycleStatus: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSchedule: (id: string) => void
  onUnschedule: (id: string) => void
  onAdd: () => void
}

function calcProgress(list: Objective[]) {
  if (!list.length) return 0
  return Math.round(list.filter(o => o.status === 'done').length / list.length * 100)
}

export default function ObjectiveList({ objectives, clientId, type, team, onCycleStatus, onEdit, onDelete, onSchedule, onUnschedule, onAdd }: Props) {
  const isMonthly = type === 'monthly'
  const title = isMonthly ? '🎯 Objetivos del mes' : '📅 Tareas'
  const emptyText = isMonthly ? 'Sin objetivos — clic en + para agregar' : 'Sin tareas — clic en + para agregar'
  const pct = calcProgress(objectives)
  const barColor = pct === 100 ? '#00C853' : (isMonthly ? '#7C4DFF' : '#2196F3')

  return (
    <div>
      <div className="obj-section-title">
        <span>{title}</span>
        <button className="add-btn" onClick={onAdd}>+ Agregar</button>
      </div>
      <div className="obj-list">
        {objectives.length === 0 ? (
          <div className="empty-obj">{emptyText}</div>
        ) : (
          objectives.map(obj => (
            <ObjectiveItem
              key={obj.id}
              obj={obj}
              clientId={clientId}
              team={team}
              onCycleStatus={onCycleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onSchedule={onSchedule}
              onUnschedule={onUnschedule}
            />
          ))
        )}
      </div>
      <div className="progress-row">
        <div className="progress-label">{isMonthly ? 'Progreso mes' : 'Progreso tareas'}</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="progress-pct">{pct}%</div>
      </div>
    </div>
  )
}
