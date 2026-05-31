const GCal = 'https://www.googleapis.com/calendar/v3'

interface EventInput {
  summary: string
  description?: string
  startTime: string  // 'YYYY-MM-DDTHH:MM:SS'
  endTime: string
  calendarId: string
  timeZone?: string
  location?: string
  recurrence?: string[]
  reminders?: { method: string; minutes: number }[]
}

async function callWithRefresh(
  url: string,
  options: RequestInit,
  providerToken: string,
  providerRefreshToken?: string
): Promise<Response> {
  const resp = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${providerToken}` },
  })

  if (resp.status !== 401 || !providerRefreshToken) return resp

  // Try to refresh the Google token
  const refreshResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: providerRefreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!refreshResp.ok) return resp

  const { access_token } = await refreshResp.json()
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${access_token}` },
  })
}

export async function createCalendarEvent(
  input: EventInput,
  providerToken: string,
  providerRefreshToken?: string
): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startTime, timeZone: input.timeZone || 'America/Argentina/Buenos_Aires' },
    end: { dateTime: input.endTime, timeZone: input.timeZone || 'America/Argentina/Buenos_Aires' },
    location: input.location,
    reminders: input.reminders
      ? { useDefault: false, overrides: input.reminders }
      : { useDefault: true },
  }

  if (input.recurrence) body.recurrence = input.recurrence

  const resp = await callWithRefresh(
    `${GCal}/calendars/${encodeURIComponent(input.calendarId)}/events`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    providerToken,
    providerRefreshToken
  )

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Calendar API error ${resp.status}: ${err.substring(0, 300)}`)
  }

  const ev = await resp.json()
  return { id: ev.id }
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string,
  providerToken: string,
  providerRefreshToken?: string
): Promise<void> {
  const resp = await callWithRefresh(
    `${GCal}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE' },
    providerToken,
    providerRefreshToken
  )

  // 404 means already deleted – that's fine
  if (!resp.ok && resp.status !== 404) {
    const err = await resp.text()
    throw new Error(`Calendar delete error ${resp.status}: ${err.substring(0, 200)}`)
  }
}

export function buildEventDescription(
  clientName: string,
  clientId: string,
  objText: string,
  objId: string,
  objType: string,
  ownerName: string,
  notes?: string | null,
  extraNotes?: string | null
): string {
  return [
    '[Flaks · Objetivo de cliente]',
    `Cliente: ${clientName}`,
    `Objetivo: ${objText}`,
    `Tipo: ${objType}`,
    `Responsable: ${ownerName}`,
    notes?.trim() ? `\nDesarrollo:\n${notes.trim()}` : '',
    extraNotes?.trim() ? `\nNotas para esta reunión:\n${extraNotes.trim()}` : '',
    `\n[clienteId:${clientId}][objId:${objId}]`,
  ].filter(Boolean).join('\n')
}

export function buildFixedDescription(
  clientName: string,
  clientId: string,
  typeLabel: string,
  freq: string,
  ownerName: string
): string {
  return [
    '[Flaks · Tarea fija]',
    `Cliente: ${clientName}`,
    `Tipo: ${typeLabel}`,
    `Frecuencia: ${freq}`,
    `Responsable: ${ownerName}`,
    `\n[clienteId:${clientId}][type:fixed-content]`,
  ].join('\n')
}
