import { useEffect, useMemo, useState, useRef } from 'react'
import { DEFAULT_CONCURRENCY, STORAGE_KEYS } from '../constants'
import { fetchAllExecutions, fetchProjects, fetchUsers } from '../api'
import { createTask, fetchStories } from '../api/endpoints'
import type { Execution, Filters, Project, User, ExcelInfo, ColumnMapping } from '../types'
import { formatMonth } from '../utils'
import { parseCSV, detectAndParseFile, formatDate } from '../utils/excelUtils'
import { downloadExcelTemplate } from '../utils/excelParser'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useShepherdTour } from '../hooks/useShepherdTour'
import { FloatingButton } from '../components/FloatingButton'
import { Panel } from '../components/Panel'
import { CheckboxMultiSelect } from '../components/CheckboxMultiSelect'

export function CreateTaskPanel() {
  const [visible, setVisible] = useState(false)
  const [userList, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(false)
  const [progressNote, setProgressNote] = useState('')
  const [excelInfo, setExcelInfo] = useState<ExcelInfo[]>([])
  const [columnMapping, setColumnMapping] = useLocalStorage<ColumnMapping>(STORAGE_KEYS.columnMapping, {
    idColumn: '编号',
    deadlineColumn: '提测时间',
    prefixColumns: ['前端', '后台', '脚本']
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filters, setFilters] = useLocalStorage<Filters>(STORAGE_KEYS.filters, {
    month: formatMonth(new Date()),
    projectIds: [],
    executionIds: [],
    userAccounts: []
  })
  const [filterByUsers, setFilterByUsers] = useState(true)
  const [createdTasks, setCreatedTasks] = useLocalStorage<string[]>(STORAGE_KEYS.createdTasks, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startTour } = useShepherdTour({
    steps: [
      {
        id: 'month-selector',
        title: '选择月份',
        text: '首先选择要创建任务的月份，系统会根据该月份设置任务的开始日期。',
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
        text: '选择要创建任务的项目。可以选择多个项目，也可以不选择（表示所有项目）。',
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
        text: '选择要创建任务的执行（迭代）。如果不选择，将使用所选项目下的所有执行。',
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
        text: '选择要创建任务的用户。如果不选择，将为所有用户创建任务。',
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
        id: 'filter-by-users',
        title: '用户过滤选项',
        text: '勾选此选项后，只有在"Users"中选择的用户才会创建任务。取消勾选则为所有用户创建任务。',
        attachTo: {
          element: '[data-tour="filter-by-users"]',
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
        id: 'file-upload',
        title: '上传文件',
        text: '上传包含任务信息的 Excel 或 CSV 文件。支持中文列名，可以下载模板查看格式要求。',
        attachTo: {
          element: '[data-tour="file-upload"]',
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
        id: 'column-mapping',
        title: '列映射配置',
        text: '配置 Excel 文件中的列名映射。设置 ID 列、截止日期列和前缀列（如前端、后台、脚本等）。',
        attachTo: {
          element: '[data-tour="column-mapping"]',
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
        text: '点击"Save Mapping & Refresh Table"保存列映射并刷新表格；点击"Create Tasks"批量创建任务；点击"Clear Cache"清除已创建任务的缓存。',
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
        id: 'excel-data-table',
        title: '数据预览表格',
        text: '这里显示从 Excel 文件解析出的数据。可以编辑开始日期和截止日期。已创建的任务会显示红色背景，选中的用户会显示绿色背景。',
        attachTo: {
          element: '[data-tour="excel-data-table"]',
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

  const accountByRealName = useMemo(() => {
    const m = new Map<string, string>()
    userList.forEach(u => m.set(u.realname, u.account))
    return m
  }, [userList])

  const refreshUsersAndProjects = async () => {
    setProgressNote('Loading userList and projects...')
    const [u, p] = await Promise.all([fetchUsers(), fetchProjects()])
    setUsers(u)
    setProjects(p)
    setProgressNote('')
  }

  useEffect(() => {
    // Preload userList and projects on first open
    if (visible && userList.length === 0) {
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

  useEffect(() => {
    // Auto-trigger compute when excelInfo is populated after file parsing
    if (excelInfo.length > 0 && visible) {
      compute().catch(err => setProgressNote(String(err)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelInfo.length, visible])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    await parseFile(file, columnMapping)
  }

  const parseFile = async (file: File, mapping: ColumnMapping) => {
    try {
      setProgressNote('Parsing file...')
      const content = await detectAndParseFile(file)
      const parsed = parseCSV(content, mapping)

      // Fill in account information and dates
      const updated = parsed.map(item => ({
        ...item,
        users: item.users.map(user => ({
          ...user,
          account: accountByRealName.get(user.realname) || ''
        })),
        estStarted: `${filters.month}-01`,
        deadline: formatDate(item.deadline, filters.month)
      }))

      setExcelInfo(updated)
      setProgressNote(`Loaded ${updated.length} items from file`)
    } catch (e) {
      console.error(e)
      setProgressNote(`Error parsing file: ${e}`)
    }
  }

  const saveColumnMapping = async () => {
    // Filter out empty prefix columns
    const cleanedMapping = {
      ...columnMapping,
      prefixColumns: columnMapping.prefixColumns.filter(prefix => prefix.trim() !== '')
    }
    setColumnMapping(cleanedMapping)

    if (uploadedFile) {
      await parseFile(uploadedFile, cleanedMapping)
    }

    setProgressNote('Column mapping saved and file re-parsed')
  }

  const createTasksParams = useMemo(() => {
    const params = []
    for (const item of excelInfo) {
      if (!item.execution || !item.taskName) continue

      for (const user of item.users) {
        if (!user.account) continue

        // Apply user filter if enabled
        if (filterByUsers && filters.userAccounts.length > 0 && !filters.userAccounts.includes(user.account)) {
          continue
        }

        // Check if task already created
        const taskKey = `${item.id}-${item.execution}-${user.account}`
        if (createdTasks.includes(taskKey)) {
          continue
        }

        params.push({
          executionId: parseInt(item.execution),
          story: item.id,
          name: `【${user.prefix}】${item.taskName}`,
          assignedTo: user.account,
          type: 'devel',
          estStarted: item.estStarted,
          deadline: item.deadline,
          taskKey
        })
      }
    }
    console.dir(params)
    return params
  }, [excelInfo, filterByUsers, filters.userAccounts, createdTasks])

  const createTasks = async () => {
    setLoading(true)
    try {
      let successCount = 0
      let errorCount = 0
      const newCreatedTasks: string[] = []

      for (const { executionId, taskKey, ...taskParams } of createTasksParams) {
        try {
          await createTask(executionId, taskParams)
          successCount++
          newCreatedTasks.push(taskKey)
        } catch (e) {
          console.error(`Failed to create task "${taskParams.name}":`, e)
          errorCount++
        }
      }

      // Update created tasks cache
      if (newCreatedTasks.length > 0) {
        setCreatedTasks([...createdTasks, ...newCreatedTasks])
      }

      setProgressNote(`Task creation completed: ${successCount} success, ${errorCount} errors`)
    } catch (e) {
      console.error(e)
      setProgressNote(String(e))
    } finally {
      setLoading(false)
    }
  }

  const compute = async () => {
    setLoading(true)
    try {
      const execIds = (filters.executionIds.length ? filters.executionIds : executions.map(e => e.id))
      setProgressNote(`Loading stories from ${execIds.length} executions...`)

      // Fetch all stories from selected executions
      const storyMap = new Map<number, { title: string; execution: string }>()

      for (const execId of execIds) {
        try {
          const stories = await fetchStories(execId)
          stories.forEach(story => {
            if (story.id) {
              storyMap.set(story.id, {
                title: story.title,
                execution: execId.toString()
              })
            }
          })
        } catch (error) {
          console.error(`Failed to fetch stories from execution ${execId}:`, error)
        }
      }

      setProgressNote(`Found ${storyMap.size} stories, updating excelInfo...`)

      // Update excelInfo with story titles and executions
      const updated = excelInfo.map(item => {
        const storyInfo = storyMap.get(item.id)
        if (storyInfo) {
          return {
            ...item,
            taskName: storyInfo.title,
            execution: storyInfo.execution
          }
        } else {
          // Keep original item if no matching story found
          return {
            ...item,
            taskName: `Story #${item.id} (not found)`,
            execution: ''
          }
        }
      })

      // Count successful matches
      const matchedCount = updated.filter(item => item.taskName && !item.taskName.includes('(not found)')).length
      const notFoundCount = updated.length - matchedCount

      setExcelInfo(updated)
      setProgressNote(`Updated task information: ${matchedCount} matched, ${notFoundCount} not found`)
    } catch (e) {
      console.error(e)
      setProgressNote(`Error loading stories: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <FloatingButton
        onClick={() => setVisible(v => !v)}
        loading={loading}
        text='Create Task'
        style={{
          right: 16,
          bottom: 70,
        }}
      />
      {visible && (
        <Panel key="create"  onClose={() => setVisible(false)}>
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
                options={userList.map(u => ({ value: u.account, label: `${u.realname} (${u.account})` }))}
                values={filters.userAccounts}
                onChange={(vals) => setFilters({ ...filters, userAccounts: vals })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-tour="filter-by-users">
              <input
                type="checkbox"
                id="filterByUsers"
                checked={filterByUsers}
                onChange={e => setFilterByUsers(e.target.checked)}
              />
              <label htmlFor="filterByUsers" style={{ fontWeight: 'normal' }}>
                Filter task creation by selected users
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16, marginBottom: 12 }} data-tour="file-upload">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Upload Excel/CSV File</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 'max-content' }}>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv,.xlsx,.xls" 
                onChange={handleFileUpload} 
              />
              {uploadedFile && (
                <>
                  <button
                    onClick={() => {
                      setUploadedFile(null)
                      setExcelInfo([])
                      setProgressNote('File cleared')
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Supports CSV, Excel (.xlsx, .xls) files with Chinese characters
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              Expected format: 编号,提测时间,前端,后端,脚本
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                onClick={downloadExcelTemplate}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Download Excel Template
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16, marginBottom: 12 }} data-tour="column-mapping">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Column Mapping</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span>ID Column:</span>
              <input
                type="text"
                value={columnMapping.idColumn}
                onChange={e => setColumnMapping({ ...columnMapping, idColumn: e.target.value })}
                style={{ width: 100 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span>Deadline Column:</span>
              <input
                type="text"
                value={columnMapping.deadlineColumn}
                onChange={e => setColumnMapping({ ...columnMapping, deadlineColumn: e.target.value })}
                style={{ width: 100 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span>Prefix Columns:</span>
              {columnMapping.prefixColumns.map((prefix, index) => (
                <div key={index} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={prefix}
                    onChange={e => {
                      const newPrefixes = [...columnMapping.prefixColumns]
                      newPrefixes[index] = e.target.value
                      setColumnMapping({ ...columnMapping, prefixColumns: newPrefixes })
                    }}
                    style={{ width: 80 }}
                  />
                  {columnMapping.prefixColumns.length > 1 && (
                    <button
                      onClick={() => {
                        const newPrefixes = columnMapping.prefixColumns.filter((_, i) => i !== index)
                        setColumnMapping({ ...columnMapping, prefixColumns: newPrefixes })
                      }}
                      style={{ padding: '2px 6px', fontSize: '12px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setColumnMapping({ ...columnMapping, prefixColumns: [...columnMapping.prefixColumns, ''] })}
                style={{ padding: '2px 8px' }}
              >
                +
              </button>
            </div>
            <div style={{ marginTop: 8 }} data-tour="action-buttons">
              <button
                onClick={async () => {
                  await saveColumnMapping()
                  await compute()
                }}
                style={{ padding: '4px 12px' }}
              >
                Save Mapping & Refresh Table
              </button>
              <button
                style={{ marginLeft: 8 }}
                onClick={createTasks}
                disabled={excelInfo.length === 0 || loading}
              >
                Create Tasks
              </button>
              <button
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setCreatedTasks([])
                  setProgressNote('Created tasks cache cleared')
                }}
                disabled={createdTasks.length === 0}
              >
                Clear Cache ({createdTasks.length})
              </button>
            </div>
            {progressNote && <div style={{ marginTop: 8, color: '#8a6d3b' }}>{progressNote}</div>}
          </div>

          {excelInfo.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 12 }} data-tour="excel-data-table">
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Excel Data ({filterByUsers ?
                  excelInfo.filter(item =>
                    item.users.some(user =>
                      user.account && (filters.userAccounts.length === 0 || filters.userAccounts.includes(user.account))
                    )
                  ).length : excelInfo.length} items)
              </label>
              <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>ID</th>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Task Name</th>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Start Date</th>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Deadline</th>
                      {columnMapping.prefixColumns.map((prefix, index) => (
                        <th key={index} style={{ border: '1px solid #ddd', padding: 4 }}>{prefix}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelInfo
                      .filter(item => {
                        if (!filterByUsers) return true
                        return item.users.some(user =>
                          user.account && (filters.userAccounts.length === 0 || filters.userAccounts.includes(user.account))
                        )
                      })
                      .map((item, index) => (
                        <tr key={item.id}>
                          <td style={{ border: '1px solid #ddd', padding: 4 }}>{item.id}</td>
                          <td style={{ border: '1px solid #ddd', padding: 4 }}>{item.taskName || 'Loading...'}</td>
                          <td style={{ border: '1px solid #ddd', padding: 4 }}>
                            <input
                              type="date"
                              value={item.estStarted}
                              onChange={e => {
                                const updated = excelInfo.map(excelItem => 
                                  excelItem.id === item.id 
                                    ? { ...excelItem, estStarted: e.target.value }
                                    : excelItem
                                )
                                setExcelInfo(updated)
                              }}
                              style={{ width: '100%', border: 'none', padding: 2 }}
                            />
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: 4 }}>
                            <input
                              type="date"
                              value={item.deadline}
                              onChange={e => {
                                const updated = excelInfo.map(excelItem => 
                                  excelItem.id === item.id 
                                    ? { ...excelItem, deadline: e.target.value }
                                    : excelItem
                                )
                                setExcelInfo(updated)
                              }}
                              style={{ width: '100%', border: 'none', padding: 2 }}
                            />
                          </td>
                          {columnMapping.prefixColumns.map((prefix, colIndex) => {
                            const user = item.users.find(u => u.prefix === prefix)
                            const shouldHighlight = filterByUsers && user && user.account &&
                              filters.userAccounts.length > 0 && filters.userAccounts.includes(user.account)
                            const taskKey = user && user.account ? `${item.id}-${item.execution}-${user.account}` : null
                            const isTaskCreated = taskKey && createdTasks.includes(taskKey)
                            return (
                              <td
                                key={colIndex}
                                style={{
                                  border: '1px solid #ddd',
                                  padding: 4,
                                  backgroundColor: isTaskCreated ? '#ffcccc' : (shouldHighlight ? '#e8f5e8' : 'transparent')
                                }}
                              >
                                {user ? `${user.realname} (${user.account || 'N/A'})${isTaskCreated ? ' ✓' : ''}` : ''}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Panel>
      )}
    </>
  )
}



