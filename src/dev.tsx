import { STORAGE_KEYS } from './constants'

// Optional mocking when running with ?mock=1
const params = new URLSearchParams(location.search)
const useMock = params.get('mock') === '1'

// Set a dev token so the UI starts usable
localStorage.setItem(STORAGE_KEYS.token, 'd92a242cb8ee23303a5cd5dbb9570e3b')

if (useMock) {
  const users = [
    { id: 1, dept: 0, account: 'alice', realname: 'Alice' },
    { id: 2, dept: 0, account: 'bob', realname: 'Bob' },
    { id: 3, dept: 0, account: 'carol', realname: 'Carol' }
  ]
  const projects = [
    { id: 101, name: 'Demo Project A' },
    { id: 102, name: 'Demo Project B' }
  ]
  const executions = [
    { id: 1001, name: 'Sprint 1', project: 101 },
    { id: 1002, name: 'Sprint 2', project: 101 },
    { id: 2001, name: 'Phase X', project: 102 }
  ]
  const tasks = [
    { id: 1, name: 'Task 1', consumed: 8, finishedBy: 'alice', finishedDate: new Date().toISOString() },
    { id: 2, name: 'Task 2', consumed: 4.5, finishedBy: 'bob', finishedDate: new Date().toISOString() },
    { id: 3, name: 'Task 3', consumed: 7, finishedBy: 'alice', finishedDate: new Date().toISOString() },
    { id: 4, name: 'Task 4', consumed: 2, finishedBy: 'carol', finishedDate: new Date().toISOString() }
  ]

  const paginate = <T,>(arr: T[], url: URL, key: string) => {
    const page = Number(url.searchParams.get('page') || '1')
    const limit = Number(url.searchParams.get('limit') || '20')
    const start = (page - 1) * limit
    const end = start + limit
    const slice = arr.slice(start, end)
    return { page, total: arr.length, limit, [key]: slice }
  }

  const realFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (href.includes('/api.php/v1/users')) {
      const url = new URL(href, location.origin)
      return new Response(JSON.stringify(paginate(users, url, 'users')), { headers: { 'Content-Type': 'application/json' } })
    }
    if (href.includes('/api.php/v1/projects/') && href.includes('/executions')) {
      const url = new URL(href, location.origin)
      const m = href.match(/projects\/(\d+)\/executions/)
      const pid = m ? Number(m[1]) : 0
      const list = executions.filter(e => e.project === pid)
      return new Response(JSON.stringify(paginate(list, url, 'executions')), { headers: { 'Content-Type': 'application/json' } })
    }
    if (href.includes('/api.php/v1/projects')) {
      const url = new URL(href, location.origin)
      return new Response(JSON.stringify(paginate(projects, url, 'projects')), { headers: { 'Content-Type': 'application/json' } })
    }
    if (href.includes('/api.php/v1/executions/') && href.includes('/tasks')) {
      const url = new URL(href, location.origin)
      return new Response(JSON.stringify(paginate(tasks, url, 'tasks')), { headers: { 'Content-Type': 'application/json' } })
    }
    return realFetch(input as any, init)
  }
}

// Import userscript entry (mounts floating UI)
import './userscript.tsx'


