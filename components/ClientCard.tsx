'use client'

import type { ClientWithAll, TeamMember, ObjectiveType } from '@/lib/types'
import ObjectiveList from './ObjectiveList'
import FixedContentSection from './FixedContentSection'
import { clientMonthlyRevenue, clientShareOfTotal, fmtARS } from '@/lib/revenue'

interface Props {
  client: ClientWithAll
  allClients: ClientWithAll[]
  team: TeamMember[]
  onEditClient: () => void
  onAddTask: () => void
  onAddMonthly: () => void
  onCycleStatus: (objId: string) => void
  onEditObjective: (objId: string, type: ObjectiveType) => void
  onDeleteObjective: (objId: string) => void
  onSchedule: (objId: string) => void
  onUnschedule: (objId: string) => void
  onAddFixed: () => void
  onDeleteFixed: (fixedId: string) => void
}

export default function ClientCard({
  client, allClients, team,
  onEditClient, onAddTask, onAddMonthly,
  onCycleStatus, onEditObjective, onDeleteObjective,
  onSchedule, onUnschedule, onAddFixed, onDeleteFixed,
}: Props) {
  const computedRev = clientMonthlyRevenue(client)
  const sharePct = clientShareOfTotal(client, allClients)
  const ticketDisplay = computedRev > 0 ? fmtARS(computedRev) : (client.ticket || '$0')
  const pctDisplay = computedRev > 0 ? `${sharePct}%` : (client.pct || '')

  return (
    <div className="client-card">
      <div className="client-header">
        <div className="client-avatar" style={{ background: client.color }}>{client.emoji}</div>
        <div>
          <div className="client-name">{client.name}</div>
          <div className="client-meta">{client.rubro}</div>
          {client.contacto !== '—' && <div className="client-meta">👤 {client.contacto}</div>}
        </div>
        <div className="client-ticket">
          <div
            className="ticket-amount"
            title={computedRev > 0 ? 'Suma de servicios mensuales activos' : 'Sin servicios con monto · valor manual'}
          >
            {ticketDisplay}
          </div>
          <div className="ticket-label">{pctDisplay}{pctDisplay ? ' · ' : ''}mensual</div>
        </div>
        <div className="client-header-actions">
          <button className="client-edit-btn" onClick={onEditClient} title="Editar cliente, servicios y ticket">
            ✏️ Editar
          </button>
        </div>
      </div>

      <div className="client-services">
        {client.services && client.services.length > 0 ? (
          client.services.map(s => {
            const amt = Number(s.amount)
            const showAmt = s.billing_type !== 'included' && isFinite(amt) && amt > 0
            const typeMark = s.billing_type === 'one-time'
              ? ' · único'
              : s.billing_type === 'included'
              ? ' · incluido'
              : ''
            return (
              <span
                key={s.id}
                className={`service-tag${s.active ? ' active' : ''}`}
                title={s.start_date ? `Desde ${s.start_date}` : ''}
              >
                {s.name}{showAmt ? ` · ${fmtARS(amt)}` : ''}{typeMark}{s.note ? ` (${s.note})` : ''}
              </span>
            )
          })
        ) : (
          <span className="service-tag">Sin servicios cargados</span>
        )}
      </div>

      <div className="objectives-area">
        {client.alert && <div className="alert-banner">⚠️ {client.alert}</div>}

        <div className="two-col">
          <ObjectiveList
            objectives={client.tasks}
            clientId={client.id}
            type="task"
            team={team}
            onCycleStatus={onCycleStatus}
            onEdit={id => onEditObjective(id, 'task')}
            onDelete={onDeleteObjective}
            onSchedule={onSchedule}
            onUnschedule={onUnschedule}
            onAdd={onAddTask}
          />
          <ObjectiveList
            objectives={client.monthlyObjectives}
            clientId={client.id}
            type="monthly"
            team={team}
            onCycleStatus={onCycleStatus}
            onEdit={id => onEditObjective(id, 'monthly')}
            onDelete={onDeleteObjective}
            onSchedule={onSchedule}
            onUnschedule={onUnschedule}
            onAdd={onAddMonthly}
          />
        </div>

        <FixedContentSection
          fixedContent={client.fixedContent}
          clientId={client.id}
          team={team}
          onAdd={onAddFixed}
          onDelete={onDeleteFixed}
        />
      </div>
    </div>
  )
}
