import { fetchAllPages } from '../lib/pagination'
import type { Execution, Project, Task, User } from '../types'

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