'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingApprovalPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="login-screen">
      <div>
        <div className="login-title">🔒 Acceso restringido</div>
        <div className="login-sub">
          Tu cuenta de Google no está autorizada para acceder al tablero Flaks.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: 12, color: '#999', textAlign: 'center', maxWidth: 320 }}>
          Si creés que esto es un error, pedile a Ezequiel que agregue tu email a la lista de acceso.
        </p>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
