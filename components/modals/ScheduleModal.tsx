'use client'

import { useEffect, useRef } from 'react'
import type { OwnerRole } from '@/lib/types'

interface Props {
  isOpen: boolean
  contextHtml: string
  defaultDate?: string
  defaultTime?: string
  defaultOwner?: OwnerRole
  loading?: boolean
  onSubmit: (opts: { date: string; time: string; durationMin: number; ownerRole: OwnerRole; location?: string; notes?: string }) => void
  onCancel: () => void
}

export default function ScheduleModal({ isOpen, contextHtml, defaultDate, defaultTime, defaultOwner = 'EZE', loading, onSubmit, onCancel }: Props) {
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)
  const durRef = useRef<HTMLSelectElement>(null)
  const ownerRef = useRef<HTMLSelectElement>(null)
  const locRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
      const ds = defaultDate || tomorrow.toISOString().split('T')[0]
      if (dateRef.current) dateRef.current.value = ds
      if (timeRef.current) timeRef.current.value = defaultTime || '10:00'
      if (durRef.current) durRef.current.value = '60'
      if (ownerRef.current) ownerRef.current.value = defaultOwner
      if (locRef.current) locRef.current.value = ''
      if (notesRef.current) notesRef.current.value = ''
    }
  }, [isOpen, defaultDate, defaultTime, defaultOwner])

  function handleSubmit() {
    const date = dateRef.current?.value || ''
    const time = timeRef.current?.value || ''
    if (!date || !time) return
    onSubmit({
      date, time,
      durationMin: parseInt(durRef.current?.value || '60', 10),
      ownerRole: (ownerRef.current?.value || 'EZE') as OwnerRole,
      location: locRef.current?.value.trim() || undefined,
      notes: notesRef.current?.value.trim() || undefined,
    })
  }

  if (!isOpen) return null
  return (
    <div className="modal-backdrop show" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">📅 Agendar en Google Calendar</div>
            <div className="modal-sub">Se crea un evento en el calendario del responsable</div>
          </div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="obj-context" dangerouslySetInnerHTML={{ __html: contextHtml }} />
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input ref={dateRef} type="date" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input ref={timeRef} type="time" className="form-input" defaultValue="10:00" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duración</label>
              <select ref={durRef} className="form-select">
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 h</option>
                <option value="90">1 h 30</option>
                <option value="120">2 h</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Responsable</label>
              <select ref={ownerRef} className="form-select">
                <option value="EZE">Ezequiel</option>
                <option value="GER">Germán</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Lugar / link (opcional)</label>
            <input ref={locRef} type="text" className="form-input" placeholder="Oficina, Meet, Zoom…" />
          </div>
          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea ref={notesRef} className="form-textarea" placeholder="Detalles adicionales para el evento" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Agendando…' : 'Agendar'}</button>
        </div>
      </div>
    </div>
  )
}
