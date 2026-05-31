/**
 * Script de migración: flaks-data.json → Supabase
 *
 * Uso:
 *   npm run migrate
 *
 * Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'

// ── Cargar .env.local manualmente (tsx no lo carga automáticamente) ─────────
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    console.warn('⚠ No se encontró .env.local — asegurate de tener las variables en el entorno')
    return
  }
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

// ── Validar variables ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
})

// ── Leer JSON ────────────────────────────────────────────────────────────────
const jsonPath = path.join(process.cwd(), 'flaks-data.json')
if (!existsSync(jsonPath)) {
  console.error('❌ No se encontró flaks-data.json en el directorio raíz')
  process.exit(1)
}

const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'))

// ── Contadores ───────────────────────────────────────────────────────────────
let cClients = 0, cServices = 0, cObjectives = 0, cFixed = 0, cActivity = 0, cTeam = 0
const errors: string[] = []

async function upsert(table: string, data: Record<string, unknown> | Record<string, unknown>[], conflict: string) {
  const rows = Array.isArray(data) ? data : [data]
  if (!rows.length) return
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict })
  if (error) throw new Error(`[${table}] ${error.message}`)
}

// ── Team members ─────────────────────────────────────────────────────────────
async function migrateTeam() {
  const config = raw.config || {}
  const team = config.team || {}

  const rows = [
    {
      role_code: 'EZE',
      name: team.EZE?.name || 'Ezequiel',
      color: team.EZE?.color || '#7C4DFF',
      initials: team.EZE?.initials || 'EZ',
      calendar_id: team.EZE?.calendarId || null,
      email: process.env.EZE_EMAIL || team.EZE?.email || null,
    },
    {
      role_code: 'GER',
      name: team.GER?.name || 'Germán',
      color: team.GER?.color || '#2196F3',
      initials: team.GER?.initials || 'GE',
      calendar_id: team.GER?.calendarId || null,
      email: process.env.GER_EMAIL || team.GER?.email || null,
    },
    {
      role_code: 'AMBOS',
      name: 'Ambos',
      color: team.AMBOS?.color || '#c05a00',
      initials: 'AM',
      calendar_id: team.AMBOS?.calendarId || config.agencyCalendarId || null,
      email: null,
    },
  ]

  await upsert('team_members', rows, 'role_code')
  cTeam = rows.length
}

// ── Clients ──────────────────────────────────────────────────────────────────
async function migrateClients() {
  const clients: Record<string, unknown>[] = raw.clients || []

  for (let i = 0; i < clients.length; i++) {
    const c = clients[i]
    const clientId = c.id as string

    // Upsert client
    await upsert('clients', {
      id: clientId,
      name: c.name,
      emoji: c.emoji || '🏷️',
      color: c.color || '#2196F3',
      rubro: c.rubro || '—',
      contacto: c.contacto || '—',
      ticket: String(c.ticket || '$0'),
      pct: String(c.pct || '0%'),
      alert: c.alert || null,
      sort_order: i,
    }, 'id')
    cClients++

    // Services
    const services = (c.services as Record<string, unknown>[] || [])
    for (let si = 0; si < services.length; si++) {
      const s = services[si]
      const amtRaw = s.amount
      const amount = amtRaw != null && amtRaw !== '' ? Number(amtRaw) : null
      await upsert('services', {
        client_id: clientId,
        name: s.name,
        active: s.active !== false,
        note: s.note || null,
        amount: isFinite(amount as number) ? amount : null,
        billing_type: s.billingType || s.billing_type || 'recurring',
        start_date: s.startDate || s.start_date || null,
        sort_order: si,
      }, 'id')
      cServices++
    }

    // monthly[] → objectives type='task'
    const monthly = (c.monthly as Record<string, unknown>[] || [])
    for (const o of monthly) {
      await upsert('objectives', {
        id: o.id,
        client_id: clientId,
        type: 'task',
        text: o.text,
        notes: o.notes || null,
        owner_role: o.owner || 'EZE',
        status: o.status || 'pending',
        scheduled_at: o.scheduledAt || null,
        scheduled_calendar_id: o.scheduledCalendarId || null,
        calendar_event_id: o.calendarEventId || null,
        changed_by: null,
        changed_by_role: o.changedBy || null,
        changed_at: o.changedAt || null,
      }, 'id')
      cObjectives++
    }

    // quarterly[] → objectives type='monthly'
    const quarterly = (c.quarterly as Record<string, unknown>[] || [])
    for (const o of quarterly) {
      await upsert('objectives', {
        id: o.id,
        client_id: clientId,
        type: 'monthly',
        text: o.text,
        notes: o.notes || null,
        owner_role: o.owner || 'EZE',
        status: o.status || 'pending',
        scheduled_at: o.scheduledAt || null,
        scheduled_calendar_id: o.scheduledCalendarId || null,
        calendar_event_id: o.calendarEventId || null,
        changed_by: null,
        changed_by_role: o.changedBy || null,
        changed_at: o.changedAt || null,
      }, 'id')
      cObjectives++
    }

    // fixedContent[]
    const fixedContent = (c.fixedContent as Record<string, unknown>[] || [])
    for (const f of fixedContent) {
      await upsert('fixed_content', {
        id: f.id,
        client_id: clientId,
        type: f.type,
        title: f.title,
        frequency: f.frequency,
        day_week: f.dayWeek || null,
        day_month: f.dayMonth || null,
        time: f.time,
        owner_role: f.owner || 'GER',
        start_date: f.startDate || null,
        calendar_event_id: f.calendarEventId || null,
        calendar_id: f.calendarId || null,
        created_by: null,
        created_at: f.createdAt || new Date().toISOString(),
      }, 'id')
      cFixed++
    }
  }
}

// ── Activity log ─────────────────────────────────────────────────────────────
async function migrateActivityLog() {
  const logs: Record<string, unknown>[] = raw.activityLog || []
  // Insert in chunks to avoid payload limits
  const CHUNK = 50
  for (let i = 0; i < logs.length; i += CHUNK) {
    const chunk = logs.slice(i, i + CHUNK).map(a => ({
      user_id: null,
      role_code: a.user || null,
      text: a.text,
      ts: a.ts || new Date().toISOString(),
    }))
    const { error } = await supabase.from('activity_log').insert(chunk)
    if (error) {
      // Activity log might already have rows if run multiple times — skip duplicates
      console.warn(`  ⚠ activity_log chunk ${i}: ${error.message}`)
    } else {
      cActivity += chunk.length
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Migrando flaks-data.json → Supabase…\n')

  try {
    process.stdout.write('  👥 Team members… ')
    await migrateTeam()
    console.log(`✓ ${cTeam} rows`)

    process.stdout.write('  🏢 Clientes, servicios, objetivos, contenido fijo… ')
    await migrateClients()
    console.log(`✓ ${cClients} clientes | ${cServices} servicios | ${cObjectives} objetivos | ${cFixed} tareas fijas`)

    process.stdout.write('  📋 Activity log… ')
    await migrateActivityLog()
    console.log(`✓ ${cActivity} entries`)

    console.log('\n✅ Migración completada!\n')
    console.log('   Verificá en Supabase → Table Editor que los datos estén correctos.')
    console.log('   Los objetivos de cada cliente aparecen en la tabla "objectives".')
    console.log('   monthly[] del JSON → type="task"')
    console.log('   quarterly[] del JSON → type="monthly"\n')

  } catch (err) {
    console.error('\n❌ Error durante la migración:', err)
    process.exit(1)
  }
}

main()
