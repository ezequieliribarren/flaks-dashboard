import type { ClientWithAll } from './types'

export function fmtARS(n: number): string {
  if (!isFinite(n) || n == null) return '$0'
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export function clientMonthlyRevenue(c: ClientWithAll | { services: { active: boolean; billing_type: string; amount: number | null }[] }): number {
  if (!c.services || !c.services.length) return 0
  return c.services.reduce((sum, s) => {
    if (!s.active) return sum
    if (s.billing_type !== 'recurring') return sum
    const amt = Number(s.amount)
    return sum + (isFinite(amt) ? amt : 0)
  }, 0)
}

export function totalMonthlyRevenue(clients: ClientWithAll[]): number {
  return clients.reduce((sum, c) => sum + clientMonthlyRevenue(c), 0)
}

export function topClientConcentration(clients: ClientWithAll[]): { pct: number; name: string; amount: number } {
  const total = totalMonthlyRevenue(clients)
  if (!total) return { pct: 0, name: '—', amount: 0 }
  let max = 0
  let maxName = '—'
  clients.forEach(c => {
    const r = clientMonthlyRevenue(c)
    if (r > max) { max = r; maxName = c.name }
  })
  return { pct: Math.round(max / total * 100), name: maxName, amount: max }
}

export function clientShareOfTotal(c: ClientWithAll, clients: ClientWithAll[]): number {
  const total = totalMonthlyRevenue(clients)
  if (!total) return 0
  return Math.round(clientMonthlyRevenue(c) / total * 100)
}
