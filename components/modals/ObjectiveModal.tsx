'use client'

import { useEffect, useRef } from 'react'
import type { ObjectiveType, OwnerRole } from '@/lib/types'

interface Props {
  isOpen: boolean
  clientName: string
  type: ObjectiveType
  isEdit: boolean
  defaultText?: string
  defaultNotes?: string
  defaultOwner?: OwnerRole
  loading?: boolean
  onSubmit: (text: string, notes: string, ownerRole: OwnerRole) => void
  onCancel: () => void
}

export default function ObjectiveModal({ isOpen, clientName, type, isEdit, defaultText = '', defaultNotes = '', defaultOwner = 'EZE', loading, onSubmit, onCancel }: Props) {
  const titleRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const ownerRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (titleRef.current) titleRef.current.value = defaultText
      if (notesRef.current) notesRef.current.value = defaultNotes
      if (ownerRef.current) ownerRef.current.value = defaultOwner
      setTimeout(() => { titleRef.current?.focus(); titleRef.current?.select() }, 50)
    }
  }, [isOpen, defaultText, defaultNotes, defaultOwner])

  function handleSubmit() {
    const text = titleRef.current?.value.trim() || ''
    if (!text) { titleRef.current?.focus(); return }
    const notes = notesRef.current?.value.trim() || ''
    const owner = (ownerRef.current?.value || 'EZE') as OwnerRole
    onSubmit(text, notes, owner)
  }

  const typeLabel = type === 'monthly' ? 'Objetivo del mes' : 'Tarea'
  const modalTitle = isEdit ? `Editar ${typeLabel.toLowerCase()}` : `Nuevo ${typeLabel.toLowerCase()}`
  const submitLabel = isEdit ? 'Guardar cambios' : (type === 'monthly' ? 'Crear objetivo' : 'Crear tarea')

  if (!isOpen) return null
  return (
    <div className="modal-backdrop show" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{modalTitle}</div>
            <div className="modal-sub">{clientName} · {typeLabel}</div>
          </div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Título</label>
            <input ref={titleRef} type="text" className="form-input" placeholder="Ej: Renegociar pricing antes de cierre de Q2" />
          </div>
          <div className="form-group">
            <label className="form-label">Responsable</label>
            <select ref={ownerRef} className="form-select">
              <option value="EZE">Ezequiel</option>
              <option value="GER">Germán</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Desarrollo / notas (opcional)</label>
            <textarea ref={notesRef} className="form-textarea" placeholder="Contexto, métricas, links, próximos pasos…" style={{ minHeight: 140 }} />
            <div className="form-hint">Aparece debajo del título y se incluye en el evento de Calendar si agendás.</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Guardando…' : submitLabel}</button>
        </div>
      </div>
    </div>
  )
}
