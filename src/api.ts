import { DEFAULT_CONCURRENCY } from './constants'
import type { Execution, Task } from './types'
import { ConcurrencyPool } from './lib/concurrency'
import { fetchExecutions, fetchTasks, fetchUsers, fetchProjects } from './api/endpoints'
import { isDoneStartedInMonth, taskConsumerAccount } from './utils/taskUtils'

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

// 重新导出所有必要的函数
export { fetchUsers, fetchProjects, fetchExecutions, fetchTasks, isDoneStartedInMonth, taskConsumerAccount }


