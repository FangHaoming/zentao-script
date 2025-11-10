export const BASE_URL = (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(location.hostname))
  ? '/ztapi'
  : `${location.protocol}//${location.hostname}/zentao/api.php/v1`

export const STORAGE_KEYS = {
  token: 'zentao_token',
  filters: 'zentao_filters',
  columnMapping: 'zentao_column_mapping',
  createdTasks: 'zentao_created_tasks'
} as const

export const DEFAULT_CONCURRENCY = 5


