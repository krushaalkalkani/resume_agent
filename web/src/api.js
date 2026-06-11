// Thin client for the FastAPI backend.
// Dev: Vite proxies /api -> :8000. Prod: set VITE_API_URL to your Render backend.

import { supabase } from './lib/supabase'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/** Synced from AuthContext so API calls use the same session as the UI. */
let activeSession = null

export function setApiSession(session) {
  activeSession = session
}

function apiPath(path) {
  return `${API_BASE}${path}`
}

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  let token = activeSession?.access_token
  if (!token && supabase) {
    const { data } = await supabase.auth.getSession()
    token = data.session?.access_token
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function formatError(data, statusText) {
  const detail = data?.detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('; ')
  }
  if (typeof detail === 'string') return detail
  return statusText
}

async function asJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatError(data, `${res.status} ${res.statusText}`))
  return data
}

export const pdfUrl = (variant = 'master') => {
  const path = variant === 'tailored' ? '/api/pdf?variant=tailored' : '/api/pdf'
  return apiPath(path)
}

export const previewUrl = (variant = 'master', ts = Date.now()) => {
  const path = variant === 'tailored'
    ? `/api/preview.png?variant=tailored&t=${ts}`
    : `/api/preview.png?t=${ts}`
  return apiPath(path)
}

async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders()
  let res
  try {
    res = await fetch(apiPath(path), {
      ...options,
      headers: { ...headers, ...options.headers },
    })
  } catch {
    const hint = API_BASE
      ? `Cannot reach API at ${API_BASE}.`
      : 'Cannot reach API. Start the backend: python3.11 -m uvicorn api:app --reload --port 8000'
    throw new Error(hint)
  }
  return res
}

export const getConfig = () => fetch(apiPath('/api/config')).then(asJson)

export const getResume = () => apiFetch('/api/resume').then(asJson)

export const generate = (resume) =>
  apiFetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify(resume),
  }).then(asJson)

export const fetchNotion = () =>
  apiFetch('/api/fetch-notion', { method: 'POST' }).then(asJson)

export const saveResume = (resume) =>
  apiFetch('/api/resume', {
    method: 'POST',
    body: JSON.stringify(resume),
  }).then(asJson)

export const tailorToJob = ({ job_description, generate_pdf = true, refresh_from_notion = false }) =>
  apiFetch('/api/tailor', {
    method: 'POST',
    body: JSON.stringify({ job_description, generate_pdf, refresh_from_notion }),
  }).then(asJson)

export const listTailored = () => apiFetch('/api/tailored').then(asJson)

export const regenerateTailored = (entryId) =>
  apiFetch(`/api/tailored/${entryId}/generate`, { method: 'POST' }).then(asJson)
