'use client'

import { useEffect, useRef, useState } from 'react'
import type { Client, Service } from '@/lib/types'

interface ServiceRow {
  id: string
  name: string
  active: boolean
  amount: string
  billing_type: string
  start_date: string
  note: string
}

function defaultStartMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function mkRow(s?: Partial<Service>): ServiceRow {
  return {
    id: Math.random().toString(36).slice(2),
    name: s?.name || '',
    active: s?.active !== false,
    amount: s?.amount != null ? String(s.amount) : '',
    billing_type: s?.billing_type || 'recurring',
    start_date: s?.start_date || defaultStartMonth(),
    note: s?.note || '',
  }
}

interface Props {
  isOpen: boolean
  editClient?: Client & { services?: Service[] }
  loading?: boolean
  onSubmit: (data: {
    name: string; emoji: string; color: string; rubro: string; contacto: string;
    ticket: string; pct: string; alert: string;
    services: Omit<ServiceRow, 'id'>[]
  }) => void
  onDelete?: () => void
  onCancel: () => void
}

export default function ClientModal({ isOpen, editClient, loading, onSubmit, onDelete, onCancel }: Props) {
  const nameRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)
  const rubroRef = useRef<HTMLInputElement>(null)
  const contactoRef = useRef<HTMLInputElement>(null)
  const ticketRef = useRef<HTMLInputElement>(null)
  const pctRef = useRef<HTMLInputElement>(null)
  const alertRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ServiceRow[]>([])

  useEffect(() => {
    if (isOpen) {
      const c = editClient
      if (nameRef.current) nameRef.current.value = c?.name || ''
      if (emojiRef.current) emojiRef.current.value = c?.emoji || '🏷️'
      if (colorRef.current) colorRef.current.value = (/^#[0-9a-f]{6}$/i.test(c?.color || '')) ? c!.color : '#2196F3'
      if (rubroRef.current) rubroRef.current.value = c?.rubro || ''
      if (contactoRef.current) contactoRef.current.value = c?.contacto || '—'
      if (ticketRef.current) ticketRef.current.value = c?.ticket || ''
      if (pctRef.current) pctRef.current.value = c?.pct || ''
      if (alertRef.current) alertRef.current.value = c?.alert || ''
      setRows((c?.services || []).map(s => mkRow(s)))
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [isOpen, editClient])

  function handleSubmit() {
    const name = nameRef.current?.value.trim() || ''
    if (!name) { nameRef.current?.focus(); return }
    onSubmit({
      name,
      emoji: emojiRef.current?.value.trim() || '🏷️',
      color: colorRef.current?.value || '#2196F3',
      rubro: rubroRef.current?.value.trim() || '—',
      contacto: contactoRef.current?.value.trim() || '—',
      ticket: ticketRef.current?.value.trim() || '$0',
      pct: pctRef.current?.value.trim() || '0%',
      alert: alertRef.current?.value.trim() || '',
      services: rows.filter(r => r.name.trim()).map(r => ({
        name: r.name, active: r.active,
        amount: r.billing_type !== 'included' && r.amount !== '' ? r.amount : '',
        billing_type: r.billing_type, start_date: r.start_date, note: r.note,
      })),
    })
  }

  function updateRow(id: string, field: keyof ServiceRow, value: string | boolean) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  if (!isOpen) return null
  return (
    <div className="modal-backdrop show" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div>
            <div className="modal-title">{editClient ? 'Editar cliente' : 'Nuevo cliente'}</div>
            <div className="modal-sub">{editClient ? 'Modificá datos, ticket o servicios' : 'Datos del cliente y servicios contratados'}</div>
          </div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Emoji</label>
              <input ref={emojiRef} type="text" className="form-input" maxLength={4} />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input ref={nameRef} type="text" className="form-input" placeholder="Ej: Soda Cocina" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input ref={colorRef} type="color" className="form-input" style={{ height: 38, padding: 3 }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rubro</label>
              <input ref={rubroRef} type="text" className="form-input" placeholder="Ej: Gastronomía" />
            </div>
            <div className="form-group">
              <label className="form-label">Contacto</label>
              <input ref={contactoRef} type="text" className="form-input" placeholder="Nombre o — si no aplica" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ticket mensual</label>
              <input ref={ticketRef} type="text" className="form-input" placeholder="$50.000" />
            </div>
            <div className="form-group">
              <label className="form-label">% facturación</label>
              <input ref={pctRef} type="text" className="form-input" placeholder="12%" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alerta (opcional)</label>
            <input ref={alertRef} type="text" className="form-input" placeholder="Banner amarillo en la tarjeta" />
            <div className="form-hint">Vacío = sin alerta</div>
          </div>
          <div className="form-group">
            <label className="form-label">Servicios contratados</label>
            <div className="services-list">
              {rows.map(r => (
                <div key={r.id} className="service-row">
                  <div className="service-row-main">
                    <input type="text" className="form-input svc-name" placeholder="Nombre del servicio" value={r.name} onChange={e => updateRow(r.id, 'name', e.target.value)} />
                    <label className="service-row-active">
                      <input type="checkbox" checked={r.active} onChange={e => updateRow(r.id, 'active', e.target.checked)} /> Activo
                    </label>
                    <button type="button" className="service-row-remove" onClick={() => setRows(prev => prev.filter(x => x.id !== r.id))}>×</button>
                  </div>
                  <div className="service-row-fields">
                    <input type="number" className="form-input" placeholder="Monto ARS" min="0" step="100" value={r.amount} onChange={e => updateRow(r.id, 'amount', e.target.value)} />
                    <select className="form-select" value={r.billing_type} onChange={e => updateRow(r.id, 'billing_type', e.target.value)}>
                      <option value="recurring">Mensual</option>
                      <option value="one-time">Único</option>
                      <option value="included">Incluido</option>
                    </select>
                    <input type="month" className="form-input" value={r.start_date} onChange={e => updateRow(r.id, 'start_date', e.target.value)} />
                    <input type="text" className="form-input" placeholder="Nota (opcional)" value={r.note} onChange={e => updateRow(r.id, 'note', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add-service-btn" onClick={() => setRows(prev => [...prev, mkRow()])}>+ Agregar servicio</button>
          </div>
        </div>
        <div className="modal-footer">
          {editClient && onDelete && (
            <button className="btn btn-danger" onClick={onDelete} style={{ marginRight: 'auto' }}>Eliminar cliente</button>
          )}
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando…' : (editClient ? 'Guardar cambios' : 'Crear cliente')}</button>
        </div>
      </div>
    </div>
  )
}
