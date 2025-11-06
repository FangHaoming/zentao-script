import { BASE_URL, STORAGE_KEYS } from '../constants'

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token)
}

export function setToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.token, token)
}

export async function httpGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const base = BASE_URL.startsWith('http') ? BASE_URL : (typeof window !== 'undefined' ? new URL(BASE_URL, window.location.origin).toString() : BASE_URL)
  const url = new URL(base + path)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const token = getToken()
  if (!token) throw new Error('Token is not set')
  const res = await fetch(url.toString(), {
    headers: { Token: token }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Request failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}