// Thin client for the FastAPI backend. Vite proxies /api -> :8000 in dev.

async function asJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `${res.status} ${res.statusText}`)
  return data
}

export const getResume = () => fetch('/api/resume').then(asJson)

export const generate = (resume) =>
  fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resume),
  }).then(asJson)

export const fetchNotion = () =>
  fetch('/api/fetch-notion', { method: 'POST' }).then(asJson)

export const saveResume = (resume) =>
  fetch('/api/resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resume),
  }).then(asJson)
