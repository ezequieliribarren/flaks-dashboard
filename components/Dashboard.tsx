'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type {
  Snapshot, TeamMember, ClientWithAll,
  ObjectiveType, OwnerRole, FixedContentType, FrequencyType,
} from '@/lib/types'

import TopBar from './TopBar'
import SummaryBar from './SummaryBar'
import ClientTabs from './ClientTabs'
import ClientCard from './ClientCard'
import ActivityLog from './ActivityLog'
import ConfirmModal from './modals/ConfirmModal'
import ObjectiveModal from './modals/ObjectiveModal'
import ScheduleModal from './modals/ScheduleModal'
import FixedContentModal from './modals/FixedContentModal'
import ClientModal from './modals/ClientModal'
import type { Client, Service } from '@/lib/types'

// ── types ──────────────────────────────────────────────────────────────────

interface ConfirmState {
  title: string; message: string; okLabel?: string; isDanger?: boolean
  resolve: (v: boolean) => void
}
interface ObjModalState {
  clientId: string; type: ObjectiveType; isEdit: boolean
  objId?: string; defaultText?: string; defaultNotes?: string; defaultOwner?: OwnerRole
}
interface SchedModalState {
  objectiveId: string; contextHtml: string
  defaultOwner?: OwnerRole; defaultDate?: string; defaultTime?: string
}
interface FixedModalState { clientId: string; clientName: string }
interface ClientModalState { editClient?: ClientWithAll }

// ── helpers ────────────────────────────────────────────────────────────────

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── component ──────────────────────────────────────────────────────────────

interface Props {
  initialSnapshot: Snapshot
  currentTeamMember: TeamMember | null
}

export default function Dashboard({ initialSnapshot, currentTeamMember }: Props) {
  const { data: snapshot, mutate } = useSWR<Snapshot>(
    '/api/snapshot',
    (url: string) => fetch(url).then(r => r.json()),
    { fallbackData: initialSnapshot, refreshInterval: 60000, revalidateOnFocus: false }
  )

  const s = snapshot || initialSnapshot
  const clients = s.clients
  const team = s.team
  const activityLog = s.activityLog

  const [activeClientId, setActiveClientId] = useState<string | null>(clients[0]?.id ?? null)
  const [syncPill, setSyncPill] = useState<{ state: 'ok' | 'stale' | 'error'; text: string }>(
    { state: 'ok', text: 'Sincronizado' }
  )
  const [statusMsg, setStatusMsg] = useState<{ text: string; kind: string } | null>(null)

  // modal states
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [objModal, setObjModal] = useState<ObjModalState | null>(null)
  const [objLoading, setObjLoading] = useState(false)
  const [schedModal, setSchedModal] = useState<SchedModalState | null>(null)
  const [schedLoading, setSchedLoading] = useState(false)
  const [fixedModal, setFixedModal] = useState<FixedModalState | null>(null)
  const [fixedLoading, setFixedLoading] = useState(false)
  const [clientModal, setClientModal] = useState<ClientModalState | null>(null)
  const [clientLoading, setClientLoading] = useState(false)

  // ── utility ──────────────────────────────────────────────────────────────

  function showError(msg: string) {
    setStatusMsg({ text: msg, kind: 'error' })
    setTimeout(() => setStatusMsg(null), 6000)
  }

  function confirm(opts: Omit<ConfirmState, 'resolve'>): Promise<boolean> {
    return new Promise(resolve => setConfirmState({ ...opts, resolve }))
  }

  async function refresh() {
    setSyncPill({ state: 'stale', text: 'Recargando…' })
    try {
      await mutate()
      setSyncPill({ state: 'ok', text: 'Sincronizado · ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) })
    } catch {
      setSyncPill({ state: 'error', text: 'Error al recargar' })
    }
  }

  async function save(fn: () => Promise<void>) {
    setSyncPill({ state: 'stale', text: 'Guardando…' })
    try {
      await fn()
      await mutate()
      setSyncPill({ state: 'ok', text: 'Sincronizado · ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) })
    } catch (e) {
      showError('Error: ' + (e as Error).message)
      setSyncPill({ state: 'error', text: 'Error de guardado' })
    }
  }

  const activeClient = clients.find(c => c.id === activeClientId) ?? clients[0] ?? null

  function findObj(objId: string) {
    for (const c of clients) {
      const t = c.tasks.find(o => o.id === objId)
      if (t) return { obj: t, client: c, type: 'task' as ObjectiveType }
      const m = c.monthlyObjectives.find(o => o.id === objId)
      if (m) return { obj: m, client: c, type: 'monthly' as ObjectiveType }
    }
    return null
  }

  // ── objective handlers ────────────────────────────────────────────────────

  async function handleCycleStatus(objId: string) {
    await save(() => apiFetch(`/api/objectives/${objId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cycle_status' }),
    }))
  }

  function handleOpenObjModal(clientId: string, type: ObjectiveType, objId?: string) {
    if (objId) {
      const found = findObj(objId)
      if (!found) return
      setObjModal({
        clientId, type, isEdit: true, objId,
        defaultText: found.obj.text,
        defaultNotes: found.obj.notes ?? '',
        defaultOwner: found.obj.owner_role,
      })
    } else {
      setObjModal({
        clientId, type, isEdit: false,
        defaultOwner: (currentTeamMember?.role_code as OwnerRole) ?? 'EZE',
      })
    }
  }

  async function handleSubmitObjective(text: string, notes: string, ownerRole: OwnerRole) {
    if (!objModal) return
    setObjLoading(true)
    try {
      if (objModal.isEdit && objModal.objId) {
        await apiFetch(`/api/objectives/${objModal.objId}`, {
          method: 'PATCH',
          body: JSON.stringify({ text, notes, owner_role: ownerRole }),
        })
      } else {
        await apiFetch('/api/objectives', {
          method: 'POST',
          body: JSON.stringify({ client_id: objModal.clientId, type: objModal.type, text, notes, owner_role: ownerRole }),
        })
      }
      setObjModal(null)
      await mutate()
    } catch (e) { showError('Error: ' + (e as Error).message) }
    finally { setObjLoading(false) }
  }

  async function handleDeleteObjective(objId: string) {
    const found = findObj(objId)
    if (!found) return
    const ok = await confirm({
      title: 'Eliminar objetivo',
      message: `¿Eliminar "${found.obj.text.substring(0, 50)}"?\n\nSi tiene un evento agendado, también se eliminará del Calendar.`,
      okLabel: 'Eliminar', isDanger: true,
    })
    if (!ok) return
    await save(() => apiFetch(`/api/objectives/${objId}`, { method: 'DELETE' }))
  }

  // ── schedule handlers ─────────────────────────────────────────────────────

  function handleOpenScheduleModal(objId: string) {
    const found = findObj(objId)
    if (!found) return
    const { obj, client } = found
    let defaultDate: string | undefined
    let defaultTime: string | undefined
    if (obj.scheduled_at) {
      const d = new Date(obj.scheduled_at)
      defaultDate = d.toISOString().split('T')[0]
      defaultTime = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    setSchedModal({
      objectiveId: objId,
      contextHtml: `<strong>${client.name}</strong> · ${obj.text}`,
      defaultOwner: obj.owner_role,
      defaultDate, defaultTime,
    })
  }

  async function handleSubmitSchedule(opts: {
    date: string; time: string; durationMin: number
    ownerRole: OwnerRole; location?: string; notes?: string
  }) {
    if (!schedModal) return
    setSchedLoading(true)
    try {
      await apiFetch('/api/calendar/schedule', {
        method: 'POST',
        body: JSON.stringify({ objectiveId: schedModal.objectiveId, ...opts }),
      })
      setSchedModal(null)
      await mutate()
    } catch (e) { showError('Error agendando: ' + (e as Error).message) }
    finally { setSchedLoading(false) }
  }

  async function handleUnschedule(objId: string) {
    const found = findObj(objId)
    if (!found?.obj.calendar_event_id) return
    const ok = await confirm({
      title: 'Quitar de Calendar',
      message: `¿Quitar el evento del Calendar de "${found.obj.text.substring(0, 40)}"?`,
      okLabel: 'Quitar', isDanger: true,
    })
    if (!ok) return
    await save(() => apiFetch('/api/calendar/unschedule', {
      method: 'POST',
      body: JSON.stringify({ objectiveId: objId }),
    }))
  }

  // ── fixed content handlers ────────────────────────────────────────────────

  function handleOpenFixedModal(clientId: string) {
    const client = clients.find(c => c.id === clientId)
    if (client) setFixedModal({ clientId, clientName: client.name })
  }

  async function handleSubmitFixed(opts: {
    type: FixedContentType; title: string; frequency: FrequencyType
    day_week?: string; day_month?: string; time: string
    owner_role: OwnerRole; start_date: string
  }) {
    if (!fixedModal) return
    setFixedLoading(true)
    try {
      await apiFetch('/api/fixed-content', {
        method: 'POST',
        body: JSON.stringify({ client_id: fixedModal.clientId, ...opts }),
      })
      setFixedModal(null)
      await mutate()
    } catch (e) { showError('Error: ' + (e as Error).message) }
    finally { setFixedLoading(false) }
  }

  async function handleDeleteFixed(fixedId: string) {
    const fixed = clients.flatMap(c => c.fixedContent).find(f => f.id === fixedId)
    if (!fixed) return
    const ok = await confirm({
      title: 'Eliminar tarea fija',
      message: `¿Eliminar tarea fija "${fixed.title}"?\n\nSe borrará la serie completa del Calendar.`,
      okLabel: 'Eliminar', isDanger: true,
    })
    if (!ok) return
    await save(() => apiFetch(`/api/fixed-content/${fixedId}`, { method: 'DELETE' }))
  }

  // ── client handlers ────────────────────────────────────────────────────────

  function handleOpenClientModal(clientId?: string) {
    if (clientId) {
      setClientModal({ editClient: clients.find(c => c.id === clientId) })
    } else {
      setClientModal({})
    }
  }

  async function handleSubmitClient(data: {
    name: string; emoji: string; color: string; rubro: string; contacto: string
    ticket: string; pct: string; alert: string
    services: { name: string; active: boolean; amount: string; billing_type: string; start_date: string; note: string }[]
  }) {
    if (!clientModal) return
    setClientLoading(true)
    const editId = clientModal.editClient?.id
    const servicesPayload = data.services
      .filter(s => s.name.trim())
      .map(s => ({
        name: s.name, active: s.active,
        amount: s.billing_type !== 'included' && s.amount !== '' ? Number(s.amount) : null,
        billing_type: s.billing_type, start_date: s.start_date || null, note: s.note || null,
      }))
    try {
      if (editId) {
        await apiFetch(`/api/clients/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...data, services: servicesPayload }),
        })
      } else {
        const { client } = await apiFetch('/api/clients', {
          method: 'POST',
          body: JSON.stringify({ ...data, services: servicesPayload }),
        })
        setActiveClientId(client.id)
      }
      setClientModal(null)
      await mutate()
    } catch (e) { showError('Error: ' + (e as Error).message) }
    finally { setClientLoading(false) }
  }

  async function handleDeleteClient() {
    const editId = clientModal?.editClient?.id
    if (!editId) return
    const client = clients.find(c => c.id === editId)
    if (!client) return
    const objCount = client.tasks.length + client.monthlyObjectives.length + client.fixedContent.length
    const ok = await confirm({
      title: 'Eliminar cliente',
      message: `¿Eliminar el cliente "${client.name}"?\n\nSe perderán ${objCount} objetivos/recurrentes y se intentarán borrar sus eventos del Calendar. Esta acción no se puede deshacer.`,
      okLabel: 'Eliminar cliente', isDanger: true,
    })
    if (!ok) return
    setClientLoading(true)
    try {
      await apiFetch(`/api/clients/${editId}`, { method: 'DELETE' })
      setClientModal(null)
      setActiveClientId(clients.find(c => c.id !== editId)?.id ?? null)
      await mutate()
    } catch (e) { showError('Error: ' + (e as Error).message) }
    finally { setClientLoading(false) }
  }

  async function handleReorderClients(newOrder: string[]) {
    try {
      await apiFetch('/api/clients/reorder', { method: 'POST', body: JSON.stringify({ order: newOrder }) })
      await mutate()
    } catch (e) { console.error('Reorder failed:', e) }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      {statusMsg && <div className={`status-bar-wrap ${statusMsg.kind}`}>{statusMsg.text}</div>}

      <TopBar
        syncState={syncPill.state}
        syncText={syncPill.text}
        currentTeamMember={currentTeamMember}
        onReload={refresh}
      />
      <SummaryBar clients={clients} />
      <ClientTabs
        clients={clients}
        activeId={activeClientId}
        onTabClick={setActiveClientId}
        onReorder={handleReorderClients}
        onAddClient={() => handleOpenClientModal()}
      />

      {activeClient ? (
        <ClientCard
          client={activeClient}
          allClients={clients}
          team={team}
          onEditClient={() => handleOpenClientModal(activeClient.id)}
          onAddTask={() => handleOpenObjModal(activeClient.id, 'task')}
          onAddMonthly={() => handleOpenObjModal(activeClient.id, 'monthly')}
          onCycleStatus={handleCycleStatus}
          onEditObjective={(objId, type) => handleOpenObjModal(activeClient.id, type, objId)}
          onDeleteObjective={handleDeleteObjective}
          onSchedule={handleOpenScheduleModal}
          onUnschedule={handleUnschedule}
          onAddFixed={() => handleOpenFixedModal(activeClient.id)}
          onDeleteFixed={handleDeleteFixed}
        />
      ) : (
        <div className="empty-obj" style={{ padding: 40 }}>
          No hay clientes todavía. Clic en <strong>+ Nuevo cliente</strong> arriba para crear el primero.
        </div>
      )}

      <ActivityLog activityLog={activityLog} team={team} />

      {/* ── Modals ── */}
      <ConfirmModal
        isOpen={!!confirmState}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        okLabel={confirmState?.okLabel}
        isDanger={confirmState?.isDanger}
        onConfirm={() => { confirmState?.resolve(true); setConfirmState(null) }}
        onCancel={() => { confirmState?.resolve(false); setConfirmState(null) }}
      />
      <ObjectiveModal
        isOpen={!!objModal}
        clientName={clients.find(c => c.id === objModal?.clientId)?.name ?? ''}
        type={objModal?.type ?? 'task'}
        isEdit={objModal?.isEdit ?? false}
        defaultText={objModal?.defaultText}
        defaultNotes={objModal?.defaultNotes}
        defaultOwner={objModal?.defaultOwner}
        loading={objLoading}
        onSubmit={handleSubmitObjective}
        onCancel={() => setObjModal(null)}
      />
      <ScheduleModal
        isOpen={!!schedModal}
        contextHtml={schedModal?.contextHtml ?? ''}
        defaultOwner={schedModal?.defaultOwner}
        defaultDate={schedModal?.defaultDate}
        defaultTime={schedModal?.defaultTime}
        loading={schedLoading}
        onSubmit={handleSubmitSchedule}
        onCancel={() => setSchedModal(null)}
      />
      <FixedContentModal
        isOpen={!!fixedModal}
        clientName={fixedModal?.clientName ?? ''}
        loading={fixedLoading}
        onSubmit={handleSubmitFixed}
        onCancel={() => setFixedModal(null)}
      />
      <ClientModal
        isOpen={!!clientModal}
        editClient={clientModal?.editClient}
        loading={clientLoading}
        onSubmit={handleSubmitClient}
        onDelete={clientModal?.editClient ? handleDeleteClient : undefined}
        onCancel={() => setClientModal(null)}
      />
    </>
  )
}
