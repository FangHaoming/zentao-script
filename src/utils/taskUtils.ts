import type { Task } from '../types'

export function isDoneStartedInMonth(task: Task, month: string): boolean {
  if (!['done', 'closed'].includes((task.status || '').toLowerCase())) return false
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