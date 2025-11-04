export const BASE_URL = (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(location.hostname))
  ? '/ztapi'
  : 'http://www.zentao.rayvision.com/zentao/api.php/v1'

export const STORAGE_KEYS = {
  token: 'd92a242cb8ee23303a5cd5dbb9570e3b',
  filters: 'zentao_filters'
} as const

export const DEFAULT_CONCURRENCY = 3


