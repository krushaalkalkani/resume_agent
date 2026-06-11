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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function apiFetch(path, options = {}, attempt = 0) {
  const headers = await getAuthHeaders()
  const url = apiPath(path)
  const maxAttempts = API_BASE ? 3 : 1

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
    return res
  } catch {
    if (attempt + 1 < maxAttempts) {
      await sleep(4000 * (attempt + 1))
      return apiFetch(path, options, attempt + 1)
    }
    const hint = API_BASE
      ? `Cannot reach API at ${API_BASE}. On Render free tier the server may be waking up — wait 30s and click Retry. Also check CORS_ORIGINS on Render includes your Vercel URL.`
      : 'Cannot reach API. Start the backend: python3.11 -m uvicorn api:app --reload --port 8000'
    throw new Error(hint)
  }
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
