import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DEFAULT_CONCURRENCY, STORAGE_KEYS } from './constants'
import { fetchAllExecutions, fetchAllTasks, fetchProjects, fetchUsers, isDoneStartedInMonth, setToken, taskConsumerAccount } from './api'
import type { Aggregation, Execution, Filters, Project, User } from './types'
import { getCookieValue, formatMonth } from './utils'
import { useLocalStorage } from './hooks/useLocalStorage'
import { FloatingButton } from './components/FloatingButton'
import { Panel } from './components/Panel'
import { CheckboxMultiSelect } from './components/CheckboxMultiSelect'
import { ResultsTable } from './components/ResultsTable'

function App() {
  const [visible, setVisible] = useState(false)
  const [tokenInput, setTokenInput] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.token)
    if (stored) return stored
    // 自动从cookie获取zentaosid
    const zentaosid = getCookieValue('zentaosid')
    return zentaosid || ''
  })
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(false)
  const [progressNote, setProgressNote] = useState('')
  const [agg, setAgg] = useState<Aggregation>(new Map())
  const [filters, setFilters] = useLocalStorage<Filters>(STORAGE_KEYS.filters, {
    month: formatMonth(new Date()),
    projectIds: [],
    executionIds: [],
    userAccounts: []
  })

  const usersByAccount = useMemo(() => {
    const m = new Map<string, User>()
    users.forEach(u => m.set(u.account, u))
    return m
  }, [users])

  const filteredAggEntries = useMemo(() => {
    const entries: Array<{ account: string; realname: string; hours: number }> = []
    const accountsToShow: string[] = filters.userAccounts.length
      ? filters.userAccounts
      : Array.from(agg.keys())
    for (const account of accountsToShow) {
      const hours = agg.get(account) || 0
      const u = usersByAccount.get(account)
      const name = u?.realname || account
      entries.push({ account, realname: name, hours })
    }
    entries.sort((a, b) => b.hours - a.hours)
    return entries
  }, [agg, filters.userAccounts, usersByAccount])

  const selectedExecutions = useMemo(() => executions.filter(e => !filters.executionIds.length || filters.executionIds.includes(e.id)), [executions, filters.executionIds])

  const handleSaveToken = () => {
    if (!tokenInput.trim()) return
    setToken(tokenInput.trim())
  }

  const refreshUsersAndProjects = async () => {
    setProgressNote('Loading users and projects...')
    const [u, p] = await Promise.all([fetchUsers(), fetchProjects()])
    setUsers(u)
    setProjects(p)
    setProgressNote('')
  }

  useEffect(() => {
    // Preload users and projects on first open
    if (visible && users.length === 0) {
      refreshUsersAndProjects().catch(err => setProgressNote(String(err)))
    }
  }, [visible])

  const loadExecutionsForSelectedProjects = async () => {
    if (!filters.projectIds.length) { setExecutions([]); return }
    setProgressNote('Loading executions...')
    const list = await fetchAllExecutions(filters.projectIds, DEFAULT_CONCURRENCY)
    setExecutions(list)
    setProgressNote('')
  }

  useEffect(() => {
    // whenever projectIds change, refresh executions
    if (visible) {
      loadExecutionsForSelectedProjects().catch(err => setProgressNote(String(err)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.projectIds, visible])

  const compute = async () => {
    setLoading(true)
    setAgg(new Map())
    try {
      const execIds = (filters.executionIds.length ? filters.executionIds : executions.map(e => e.id))
      setProgressNote(`Loading tasks from ${execIds.length} executions...`)
      await fetchAllTasks(execIds, (batch) => {
        // rolling aggregation
        setAgg(prev => {
          const next = new Map(prev)
          for (const t of batch) {
            if (!isDoneStartedInMonth(t, filters.month)) continue
            const account = taskConsumerAccount(t)
            if (!account) continue
            const consumed = Number(t.consumed || 0)
            if (!consumed) continue
            next.set(account, (next.get(account) || 0) + consumed)
          }
          return next
        })
      }, DEFAULT_CONCURRENCY)
      setProgressNote('')
    } catch (e) {
      setProgressNote(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <FloatingButton onClick={() => setVisible(v => !v)} loading={loading} />
      {visible && (
        <Panel onClose={() => setVisible(false)}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontWeight: 600 }}>Token</label>
              <input style={{ marginLeft: 8, width: 280 }} value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Paste Token" />
              <button style={{ marginLeft: 8 }} onClick={handleSaveToken}>Save</button>
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Month</label>
              <input style={{ marginLeft: 8 }} type="month" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Projects</label>
              <CheckboxMultiSelect
                options={projects.map(p => ({ value: p.id, label: p.name }))}
                values={filters.projectIds}
                onChange={(vals) => setFilters({ ...filters, projectIds: vals, executionIds: [] })}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Executions</label>
              <CheckboxMultiSelect
                options={executions
                  .filter(e => !filters.projectIds.length || filters.projectIds.includes(e.project))
                  .map(e => ({ value: e.id, label: e.name }))}
                values={filters.executionIds}
                onChange={(vals) => setFilters({ ...filters, executionIds: vals })}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Users</label>
              <CheckboxMultiSelect
                options={users.map(u => ({ value: u.account, label: `${u.realname} (${u.account})` }))}
                values={filters.userAccounts}
                onChange={(vals) => setFilters({ ...filters, userAccounts: vals })}
              />
            </div>
            <div>
              <button onClick={refreshUsersAndProjects}>Reload meta</button>
              <button style={{ marginLeft: 8 }} onClick={compute}>Refresh report</button>
            </div>
          </div>
          {progressNote && <div style={{ marginTop: 8, color: '#8a6d3b' }}>{progressNote}</div>}
          <div style={{ marginTop: 12 }}>
            <ResultsTable rows={filteredAggEntries.map(e => ({ realname: e.realname, hours: e.hours }))} />
          </div>
        </Panel>
      )}
    </>
  )
}









function mount() {
  // 只在主窗口中挂载，避免在iframe中重复挂载
  if (window.self !== window.top) {
    console.log('ZenTao userscript: Skip mounting in iframe')
    return
  }
  
  const containerId = 'zentao-userscript-container'
  
  // 清理所有已存在的容器（处理HMR重载）
  const existingContainers = document.querySelectorAll(`#${containerId}`)
  existingContainers.forEach(el => el.remove())
  
  const container = document.createElement('div')
  container.id = containerId
  document.body.appendChild(container)
  
  const root = createRoot(container)
  root.render(<App />)
}

// 确保DOM加载完成后再挂载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}


