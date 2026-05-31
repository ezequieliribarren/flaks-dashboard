'use client'

import { useEffect, useRef } from 'react'

interface Props {
  isOpen: boolean
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function PromptModal({ isOpen, title, message, defaultValue = '', placeholder, onConfirm, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.value = defaultValue
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 50)
    }
  }, [isOpen, defaultValue])

  function handleSubmit() {
    onConfirm(inputRef.current?.value || '')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') onCancel()
  }

  if (!isOpen) return null
  return (
    <div className="modal-backdrop show" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          {message && <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5, marginBottom: 14, whiteSpace: 'pre-line' }}>{message}</div>}
          <input ref={inputRef} type="text" className="form-input" placeholder={placeholder} onKeyDown={handleKey} style={{ fontSize: 14, padding: '10px 12px' }} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Aceptar</button>
        </div>
      </div>
    </div>
  )
}
