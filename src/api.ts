import { BASE_URL, DEFAULT_CONCURRENCY, STORAGE_KEYS } from './constants'
import type { Execution, PagedResponse, Project, Task, User } from './types'

function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token)
}

export function setToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.token, token)
}

async function httpGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
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

// Limit concurrent promises
class ConcurrencyPool {
  private queue: Array<() => Promise<void>> = []
  private active = 0
  constructor(private readonly limit: number) {}
  run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try {
          this.active++
          const result = await fn()
          resolve(result)
        } catch (e) {
          reject(e)
        } finally {
          this.active--
          this.next()
        }
      }
      this.queue.push(task)
      this.next()
    })
  }
  private next() {
    if (this.active >= this.limit) return
    const task = this.queue.shift()
    if (task) task()
  }
}

async function fetchAllPages<TKey extends string, TItem>(
  path: string,
  key: TKey,
  baseQuery?: Record<string, string | number | undefined>
): Promise<{ items: TItem[]; meta: { total: number } }> {
  const first = await httpGet<PagedResponse<TItem, TKey>>(path, { ...baseQuery })
  const total = first.total
  const limit = first.limit
  const pageCount = Math.ceil(total / limit)
  const items: TItem[] = [...(((first as unknown as Record<string, unknown>)[key as unknown as string]) as TItem[])]
  if (pageCount <= 1) return { items, meta: { total } }

  for (let page = 2; page <= pageCount; page++) {
    const pageData = await httpGet<PagedResponse<TItem, TKey>>(path, { ...baseQuery, page, limit })
    const pageItems = ((pageData as unknown as Record<string, unknown>)[key as unknown as string]) as TItem[]
    items.push(...pageItems)
  }
  return { items, meta: { total } }
}

export async function fetchUsers(): Promise<User[]> {
  const { items } = await fetchAllPages('/users', 'users', { browse: '' })
  return items as unknown as User[]
}

export async function fetchProjects(): Promise<Project[]> {
  const { items } = await fetchAllPages('/projects', 'projects')
  return items as unknown as Project[]
}

export async function fetchExecutions(projectId: number): Promise<Execution[]> {
  const { items } = await fetchAllPages(`/projects/${projectId}/executions`, 'executions')
  return items as unknown as Execution[]
}

export async function fetchTasks(executionId: number): Promise<Task[]> {
  const { items } = await fetchAllPages(`/executions/${executionId}/tasks`, 'tasks')
  return items as unknown as Task[]
}

export async function fetchAllExecutions(projectIds: number[], concurrency = DEFAULT_CONCURRENCY): Promise<Execution[]> {
  const pool = new ConcurrencyPool(concurrency)
  const results: Execution[] = []
  await Promise.all(
    projectIds.map((pid) =>
      pool.run(async () => {
        const list = await fetchExecutions(pid)
        results.push(...list)
      })
    )
  )
  return results
}

export async function fetchAllTasks(executionIds: number[], onBatch?: (tasks: Task[]) => void, concurrency = DEFAULT_CONCURRENCY): Promise<Task[]> {
  const pool = new ConcurrencyPool(concurrency)
  const results: Task[] = []
  await Promise.all(
    executionIds.map((eid) =>
      pool.run(async () => {
        const list = await fetchTasks(eid)
        results.push(...list)
        onBatch?.(list)
      })
    )
  )
  return results
}

export function isDoneStartedInMonth(task: Task, month: string): boolean {
  if ((task.status || '').toLowerCase() !== 'done') return false
  const start = new Date(month + '-01T00:00:00')
  if (isNaN(start.getTime())) return false
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  const started = task.realStarted
  if (!started) return false
  const d = new Date(started)
  if (isNaN(d.getTime())) return false
  return d >= start && d < end
}

export function taskConsumerAccount(task: Task): string | undefined {
  return task.finishedBy?.account || task.closedBy?.account || task.assignedTo?.account
}


