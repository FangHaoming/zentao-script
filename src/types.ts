export type User = {
  id: number
  dept: number
  account: string
  realname: string
  role?: string
  email?: string
}

export type Project = {
  id: number
  name: string
}

export type Execution = {
  id: number
  name: string
  project: number
}

export type Task = {
  id: number
  name: string
  status?: string
  consumed?: number
  finishedBy?: UserRef
  finishedDate?: string
  closedBy?: UserRef
  closedDate?: string
  assignedTo?: UserRef
  realStarted?: string
}

export type PagedResponse<TItem, TKey extends string> = {
  page: number
  total: number
  limit: number
} & { [K in TKey]: TItem[] }

export type Filters = {
  month: string // "YYYY-MM"
  projectIds: number[]
  executionIds: number[]
  userAccounts: string[]
}

export type UserRef = {
  id: number
  account: string
  avatar?: string
  realname: string
}


