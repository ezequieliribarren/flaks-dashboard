'use client'

interface Props {
  isOpen: boolean
  title: string
  message: string
  okLabel?: string
  isDanger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ isOpen, title, message, okLabel = 'Aceptar', isDanger, onConfirm, onCancel }: Props) {
  if (!isOpen) return null
  return (
    <div className="modal-backdrop show" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
