'use client'

import type { ClientWithAll } from '@/lib/types'
import { totalMonthlyRevenue, topClientConcentration, fmtARS, clientMonthlyRevenue } from '@/lib/revenue'

interface Props {
  clients: ClientWithAll[]
}

export default function SummaryBar({ clients }: Props) {
  const totalRev = totalMonthlyRevenue(clients)
  const priced = clients.filter(c => clientMonthlyRevenue(c) > 0).length
  const conc = topClientConcentration(clients)
  const monthLabel = new Date().toLocaleDateString('es-AR', { month: 'long' })

  let totalDone = 0, totalTasks = 0, totalScheduled = 0
  clients.forEach(c => {
    ;(c.tasks || []).forEach(o => {
      totalTasks++
      if (o.status === 'done') totalDone++
      if (o.calendar_event_id) totalScheduled++
    })
    ;(c.monthlyObjectives || []).forEach(o => { if (o.calendar_event_id) totalScheduled++ })
    totalScheduled += (c.fixedContent || []).filter(f => f.calendar_event_id).length
  })

  return (
    <div className="summary-bar">
      <div className="summary-chip">
        <div className="sc-label">Facturación {monthLabel}</div>
        <div className="sc-value">{fmtARS(totalRev)}</div>
        <div className="sc-pct">{priced}/{clients.length} clientes con monto</div>
      </div>
      <div className="summary-chip">
        <div className="sc-label">Clientes activos</div>
        <div className="sc-value">{clients.length}</div>
        <div className="sc-pct">en el tablero</div>
      </div>
      <div className="summary-chip">
        <div className="sc-label">Concentración top</div>
        {conc.pct === 0 ? (
          <>
            <div className="sc-value">—</div>
            <div className="sc-pct">Sin facturación cargada</div>
          </>
        ) : (
          <>
            <div className={`sc-value${conc.pct >= 50 ? ' conc-warn' : ''}`}>{conc.pct}%</div>
            <div className="sc-pct">{conc.pct >= 50 ? '⚠ ' : ''}{conc.name}</div>
          </>
        )}
      </div>
      <div className="summary-chip">
        <div className="sc-label">Tareas</div>
        <div className="sc-value">{totalDone}/{totalTasks}</div>
        <div className="sc-pct">completadas</div>
      </div>
      <div className="summary-chip">
        <div className="sc-label">Agendados a Calendar</div>
        <div className="sc-value">{totalScheduled}</div>
        <div className="sc-pct">eventos creados</div>
      </div>
    </div>
  )
}
