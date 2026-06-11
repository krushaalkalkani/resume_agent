// API client — dev uses Vite proxy (/api → localhost:8000).
// Production calls Render directly (CORS enabled on the API).

import { supabase } from './lib/supabase'

const RENDER_API = 'https://resume-agent-api-a275.onrender.com'

function getApiBase() {
  if (import.meta.env.DEV) return ''
  const fromEnv = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return RENDER_API
  }
  return ''
}

const API_BASE = getApiBase()

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

let apiWarmed = false

/** Wake Render free-tier instance before real requests. */
export async function warmApi() {
  if (apiWarmed || !API_BASE) return
  for (let i = 0; i < 8; i++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 90000)
      const res = await fetch(apiPath('/api/health'), { signal: ctrl.signal })
      clearTimeout(timer)
      if (res.ok) {
        apiWarmed = true
        return
      }
    } catch {
      /* Render may be cold-starting */
    }
    await sleep(5000)
  }
}

async function apiFetch(path, options = {}, attempt = 0) {
  if (API_BASE && !apiWarmed && path !== '/api/health') {
    await warmApi()
  }

  const headers = await getAuthHeaders()
  const maxAttempts = API_BASE ? 4 : 1

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 90000)
    const res = await fetch(apiPath(path), {
      ...options,
      signal: ctrl.signal,
      headers: { ...headers, ...options.headers },
    })
    clearTimeout(timer)
    return res
  } catch {
    if (attempt + 1 < maxAttempts) {
      await sleep(6000)
      return apiFetch(path, options, attempt + 1)
    }
    if (API_BASE) {
      throw new Error(
        'API is waking up (Render free tier can take up to a minute). Please wait and click Retry.',
      )
    }
    throw new Error(
      'Cannot reach API. Start the backend: python3.11 -m uvicorn api:app --reload --port 8000',
    )
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
