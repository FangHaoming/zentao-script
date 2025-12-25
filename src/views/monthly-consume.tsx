import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DEFAULT_CONCURRENCY, STORAGE_KEYS } from '../constants'
import { fetchAllExecutions, fetchAllTasks, fetchProjects, fetchUsers, isDoneStartedInMonth, taskConsumerAccount } from '../api'
import type { Aggregation, Execution, Filters, Project, User } from '../types'
import { formatMonth } from '../utils'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useShepherdTour } from '../hooks/useShepherdTour'
import { FloatingButton } from '../components/FloatingButton'
import { Panel } from '../components/Panel'
import { CheckboxMultiSelect } from '../components/CheckboxMultiSelect'
import { ResultsTable } from '../components/ResultsTable'

export function MonthlyConsume() {
  const [visible, setVisible] = useState(false)
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
  const { startTour } = useShepherdTour({
    steps: [
      {
        id: 'month-selector',
        title: '选择月份',
        text: '首先选择要统计的月份，系统会统计该月份内已完成任务的工时消耗。',
        attachTo: {
          element: '[data-tour="month-selector"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: '下一步',
            action: (tour) => tour.next()
          }
        ]
      },
      {
        id: 'project-selector',
        title: '选择项目',
        text: '选择要统计的项目。可以选择多个项目，也可以不选择（表示统计所有项目）。',
        attachTo: {
          element: '[data-tour="project-selector"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: '上一步',
            action: (tour) => tour.back()
          },
          {
            text: '下一步',
            action: (tour) => tour.next()
          }
        ]
      },
      {
        id: 'execution-selector',
        title: '选择执行',
        text: '选择要统计的执行（迭代）。如果不选择，将统计所选项目下的所有执行。',
        attachTo: {
          element: '[data-tour="execution-selector"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: '上一步',
            action: (tour) => tour.back()
          },
          {
            text: '下一步',
            action: (tour) => tour.next()
          }
        ]
      },
      {
        id: 'user-selector',
        title: '选择用户',
        text: '选择要统计的用户。如果不选择，将显示所有用户的工时统计。',
        attachTo: {
          element: '[data-tour="user-selector"]',
          on: 'bottom'
        },
        buttons: [
          {
            text: '上一步',
            action: (tour) => tour.back()
          },
          {
            text: '下一步',
            action: (tour) => tour.next()
          }
        ]
      },
      {
        id: 'action-buttons',
        title: '操作按钮',
        text: '点击"Reload meta"重新加载用户和项目数据，点击"Refresh report"生成或刷新统计报告。',
        attachTo: {
          element: '[data-tour="action-buttons"]',
          on: 'top'
        },
        buttons: [
          {
            text: '上一步',
            action: (tour) => tour.back()
          },
          {
            text: '下一步',
            action: (tour) => tour.next()
          }
        ]
      },
      {
        id: 'results-table',
        title: '统计结果',
        text: '这里显示统计结果，包括每个用户的工时消耗（小时和天数）。数据按工时从高到低排序。',
        attachTo: {
          element: '[data-tour="results-table"]',
          on: 'top'
        },
        buttons: [
          {
            text: '上一步',
            action: (tour) => tour.back()
          },
          {
            text: '完成',
            action: (tour) => tour.complete()
          }
        ]
      }
    ],
    showArrow: false
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
      console.error(e)
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
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label style={{ fontWeight: 600 }}>Month</label>
              <input 
                data-tour="month-selector"
                style={{ marginLeft: 8 }} 
                type="month" 
                value={filters.month} 
                onChange={e => setFilters({ ...filters, month: e.target.value })} 
              />
            </div>
            <button 
              onClick={startTour}
              style={{ 
                padding: '6px 12px', 
                background: '#52c41a', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              📖 开始指引
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <div data-tour="project-selector">
              <label style={{ fontWeight: 600 }}>Projects</label>
              <CheckboxMultiSelect
                options={projects.map(p => ({ value: p.id, label: p.name }))}
                values={filters.projectIds}
                onChange={(vals) => setFilters({ ...filters, projectIds: vals, executionIds: [] })}
              />
            </div>
            <div data-tour="execution-selector">
              <label style={{ fontWeight: 600 }}>Executions</label>
              <CheckboxMultiSelect
                options={executions
                  .filter(e => !filters.projectIds.length || filters.projectIds.includes(e.project))
                  .map(e => ({ value: e.id, label: e.name }))}
                values={filters.executionIds}
                onChange={(vals) => setFilters({ ...filters, executionIds: vals })}
              />
            </div>
            <div data-tour="user-selector">
              <label style={{ fontWeight: 600 }}>Users</label>
              <CheckboxMultiSelect
                options={users.map(u => ({ value: u.account, label: `${u.realname} (${u.account})` }))}
                values={filters.userAccounts}
                onChange={(vals) => setFilters({ ...filters, userAccounts: vals })}
              />
            </div>
            <div data-tour="action-buttons">
              <button onClick={refreshUsersAndProjects}>Reload meta</button>
              <button style={{ marginLeft: 8 }} onClick={compute}>Refresh report</button>
            </div>
          </div>
          {progressNote && <div style={{ marginTop: 8, color: '#8a6d3b' }}>{progressNote}</div>}
          <div style={{ marginTop: 12 }} data-tour="results-table">
            <ResultsTable rows={filteredAggEntries.map(e => ({ realname: e.realname, hours: e.hours }))} />
          </div>
        </Panel>
      )}
    </>
  )
}



