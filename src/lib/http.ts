import { BASE_URL } from '../constants'

export async function httpGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const base = BASE_URL.startsWith('http') ? BASE_URL : (typeof window !== 'undefined' ? new URL(BASE_URL, window.location.origin).toString() : BASE_URL)
  const url = new URL(base + path)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Request failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}