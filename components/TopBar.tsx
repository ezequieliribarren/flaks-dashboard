'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TeamMember } from '@/lib/types'

interface Props {
  syncState: 'ok' | 'stale' | 'error'
  syncText: string
  currentTeamMember: TeamMember | null
  onReload: () => void
}

export default function TopBar({ syncState, syncText, currentTeamMember, onReload }: Props) {
  const router = useRouter()
  const monthName = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const monthCap = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="topbar">
      <div>
        <h1>🏢 Clientes Flaks</h1>
        <div className="sub">{monthCap}</div>
      </div>
      <div className="topbar-actions">
        <div className={`sync-pill${syncState !== 'ok' ? ` ${syncState}` : ''}`}>
          <div className="dot" />
          <span>{syncText}</span>
        </div>
        <button className="icon-btn" onClick={onReload} title="Recargar desde la base de datos">
          🔄 Recargar
        </button>
        {currentTeamMember && (
          <div className="user-pill" onClick={handleLogout} title="Cerrar sesión">
            <div className="user-pill-avatar" style={{ background: currentTeamMember.color }}>
              {currentTeamMember.initials}
            </div>
            <div>
              <div className="user-pill-name">{currentTeamMember.name}</div>
              <div className="user-pill-change">Salir</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
