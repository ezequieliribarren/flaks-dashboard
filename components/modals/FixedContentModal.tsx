'use client'

import { useEffect, useRef, useState } from 'react'
import type { FixedContentType, FrequencyType, OwnerRole } from '@/lib/types'

interface Props {
  isOpen: boolean
  clientName: string
  loading?: boolean
  onSubmit: (opts: {
    type: FixedContentType; title: string; frequency: FrequencyType;
    day_week?: string; day_month?: string; time: string;
    owner_role: OwnerRole; start_date: string
  }) => void
  onCancel: () => void
}

export default function FixedContentModal({ isOpen, clientName, loading, onSubmit, onCancel }: Props) {
  const typeRef = useRef<HTMLSelectElement>(null)
  const ownerRef = useRef<HTMLSelectElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const freqRef = useRef<HTMLSelectElement>(null)
  const dayWeekRef = useRef<HTMLSelectElement>(null)
  const dayMonthRef = useRef<HTMLSelectElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const [freq, setFreq] = useState<FrequencyType>('weekly')

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      if (typeRef.current) typeRef.current.value = 'historia'
      if (ownerRef.current) ownerRef.current.value = 'GER'
      if (titleRef.current) titleRef.current.value = ''
      if (freqRef.current) freqRef.current.value = 'weekly'
      if (dayWeekRef.current) dayWeekRef.current.value = 'FR'
      if (dayMonthRef.current) dayMonthRef.current.value = '15'
      if (timeRef.current) timeRef.current.value = '10:00'
      if (startRef.current) startRef.current.value = today
      setFreq('weekly')
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [isOpen])

  function handleSubmit() {
    const title = titleRef.current?.value.trim() || ''
    const startDate = startRef.current?.value || ''
    const time = timeRef.current?.value || ''
    if (!title || !startDate || !time) return
    const currentFreq = (freqRef.current?.value || 'weekly') as FrequencyType
    onSubmit({
      type: (typeRef.current?.value || 'historia') as FixedContentType,
      title, frequency: currentFreq,
      day_week: currentFreq !== 'monthly' ? (dayWeekRef.current?.value || 'FR') : undefined,
      day_month: currentFreq === 'monthly' ? (dayMonthRef.current?.value || '15') : undefined,
      time, owner_role: (ownerRef.current?.value || 'GER') as OwnerRole,
      start_date: startDate,
    })
  }

  if (!isOpen) return null
  return (
    <div className="modal-backdrop show" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">🔁 Tareas fijas recurrentes</div>
            <div className="modal-sub">Crea un evento recurrente en el calendario del responsable</div>
          </div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="obj-context"><strong>{clientName}</strong> · Tareas fijas recurrentes</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select ref={typeRef} className="form-select">
                <option value="historia">📸 Historia</option>
                <option value="carrusel">🎠 Carrusel</option>
                <option value="reel">🎬 Reel</option>
                <option value="video">🎥 Video</option>
                <option value="post">📝 Post</option>
                <option value="informe">📊 Informe</option>
                <option value="otro">✨ Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Responsable</label>
              <select ref={ownerRef} className="form-select">
                <option value="GER">Germán</option>
                <option value="EZE">Ezequiel</option>
                <option value="AMBOS">Ambos</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Título / descripción</label>
            <input ref={titleRef} type="text" className="form-input" placeholder="Ej: Historia destacada del producto" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Frecuencia</label>
              <select ref={freqRef} className="form-select" onChange={e => setFreq(e.target.value as FrequencyType)}>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal (cada 2 semanas)</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{freq === 'monthly' ? 'Día del mes' : 'Día de la semana'}</label>
              {freq !== 'monthly' ? (
                <select ref={dayWeekRef} className="form-select">
                  <option value="MO">Lunes</option><option value="TU">Martes</option>
                  <option value="WE">Miércoles</option><option value="TH">Jueves</option>
                  <option value="FR">Viernes</option><option value="SA">Sábado</option>
                  <option value="SU">Domingo</option>
                </select>
              ) : (
                <select ref={dayMonthRef} className="form-select">
                  <option value="1">Día 1</option><option value="5">Día 5</option>
                  <option value="10">Día 10</option><option value="15">Día 15</option>
                  <option value="20">Día 20</option><option value="25">Día 25</option>
                  <option value="28">Día 28</option>
                </select>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input ref={timeRef} type="time" className="form-input" defaultValue="10:00" />
            </div>
            <div className="form-group">
              <label className="form-label">Inicio (primera fecha)</label>
              <input ref={startRef} type="date" className="form-input" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Creando…' : 'Crear recurrente'}</button>
        </div>
      </div>
    </div>
  )
}
