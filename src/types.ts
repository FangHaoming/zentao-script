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
  execution?: number // 所属执行
}

export type Story = {
  id: number
  title: string
  status?: string
  execution?: number // 所属执行
  openedBy?: UserRef
  openedDate?: string
  assignedTo?: UserRef
  pri?: number
  estimate?: number
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

export type Aggregation = Map<string, number> // account -> hours

export type ExcelInfo = {
  id: number
  users: Array<{
    prefix: string
    realname: string
    account: string
  }>
  deadline: string
  estStarted: string
  taskName: string
  execution: string
}

export type ColumnMapping = {
  idColumn: string
  deadlineColumn: string
  prefixColumns: string[]
}

export type TaskCreationParams = {
  story: number
  name: string
  assignedTo: string
  type: string
  estStarted: string
  deadline: string
}


