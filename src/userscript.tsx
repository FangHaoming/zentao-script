import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DEFAULT_CONCURRENCY, STORAGE_KEYS } from './constants'
import { fetchAllExecutions, fetchAllTasks, fetchProjects, fetchUsers, isDoneStartedInMonth, setToken, taskConsumerAccount } from './api'
import type { Execution, Filters, Project, Task, User } from './types'

type Aggregation = Map<string, number> // account -> hours

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, [key, state])
  return [state, setState] as const
}

function formatHours(h: number): string { return (Math.round(h * 100) / 100).toFixed(2) }
function toDays(h: number): string { return formatHours(h / 8) }

function App() {
  const [visible, setVisible] = useState(false)
  const [tokenInput, setTokenInput] = useState(localStorage.getItem(STORAGE_KEYS.token) || '')
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

  const shadowHostRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (shadowHostRef.current) return
    const host = document.createElement('div')
    host.id = 'zentao-userscript-host'
    host.style.position = 'fixed'
    host.style.zIndex = '2147483647'
    host.style.right = '16px'
    host.style.bottom = '16px'
    document.body.appendChild(host)
    shadowHostRef.current = host
  }, [])

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

function FloatingButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', right: 16, bottom: 16, padding: '10px 14px', borderRadius: 20,
        background: '#1677ff', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 2147483647
      }}
      title="ZenTao Monthly Consumed Report"
    >
      {loading ? 'Loading…' : 'Report'}
    </button>
  )
}

function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 64, width: 820, maxHeight: '70vh', overflow: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 2147483647 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>ZenTao Monthly Consumed Report</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  )
}

function CheckboxMultiSelect({ options, values, onChange }: { options: Array<{ value: any; label: string }>; values: any[]; onChange: (v: any[]) => void }) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return options
    const k = keyword.trim().toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(k) || String(o.value).toLowerCase().includes(k))
  }, [options, keyword])

  const toggle = (val: any) => {
    const set = new Set(values)
    if (set.has(val)) set.delete(val)
    else set.add(val)
    onChange(Array.from(set))
  }

  const clearAll = () => onChange([])
  const selectAllFiltered = () => onChange(Array.from(new Set([...values, ...filtered.map(f => f.value)])))

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }} style={{ minWidth: 240 }}>
        {values.length ? `Selected (${values.length})` : 'Select...'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: 320, background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 2147483647 }} onClick={e => e.stopPropagation()}>
          <input placeholder="Search..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={selectAllFiltered}>Select filtered</button>
            <button type="button" onClick={clearAll}>Clear</button>
          </div>
          <div style={{ maxHeight: 220, overflow: 'auto', paddingRight: 4 }}>
            {filtered.map(o => (
              <label key={String(o.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <input type="checkbox" checked={values.includes(o.value)} onChange={() => toggle(o.value)} />
                <span title={o.label} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</span>
              </label>
            ))}
            {!filtered.length && <div style={{ color: '#999' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function ResultsTable({ rows }: { rows: Array<{ realname: string; hours: number }> }) {
  const total = rows.reduce((s, r) => s + r.hours, 0)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>用户名称</th>
          <th style={thStyle}>消耗工时（小时）</th>
          <th style={thStyle}>消耗工时（天，8小时/天）</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td style={tdStyle}>{r.realname}</td>
            <td style={tdStyle}>{formatHours(r.hours)}</td>
            <td style={tdStyle}>{toDays(r.hours)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td style={tdStyle}>合计</td>
          <td style={tdStyle}>{formatHours(total)}</td>
          <td style={tdStyle}>{toDays(total)}</td>
        </tr>
      </tfoot>
    </table>
  )
}

const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px', background: '#fafafa' }
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #f3f3f3', padding: '8px 6px' }

function pad2(n: number): string { return n < 10 ? '0' + n : String(n) }
function formatMonth(d: Date): string { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}` }

function mount() {
  const containerId = 'zentao-userscript-container'
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
  }
  const root = createRoot(container)
  root.render(<App />)
}

mount()


