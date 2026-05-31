'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
    // Si no hay error, el middleware redirige automáticamente al tablero
  }

  return (
    <div className="login-screen">
      <div>
        <div className="login-title">🏢 Tablero Flaks</div>
        <div className="login-sub">Ingresá con tu usuario y contraseña</div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}
      >
        {error && (
          <div style={{
            color: '#d32f2f', fontSize: 13,
            background: '#ffeaea', padding: '10px 16px', borderRadius: 8,
          }}>
            {error}
          </div>
        )}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email.trim() || !password}
          style={{ fontSize: 14, padding: '11px 16px', marginTop: 4 }}
        >
          {loading ? 'Ingresando…' : 'Entrar →'}
        </button>
      </form>

      <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center' }}>
        Solo cuentas autorizadas pueden acceder.
      </p>
    </div>
  )
}
