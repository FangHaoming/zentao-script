import { httpGet } from './http'
import type { PagedResponse } from '../types'

export async function fetchAllPages<TKey extends string, TItem>(
  path: string,
  key: TKey,
  baseQuery?: Record<string, string | number | undefined>
): Promise<{ items: TItem[]; meta: { total: number } }> {
  const first = await httpGet<PagedResponse<TItem, TKey>>(path, { ...baseQuery })
  const total = first.total
  const limit = first.limit
  const pageCount = Math.ceil(total / limit)
  const items: TItem[] = [...(((first as unknown as Record<string, unknown>)[key as unknown as string]) as TItem[])]
  if (pageCount <= 1) return { items, meta: { total } }

  for (let page = 2; page <= pageCount; page++) {
    const pageData = await httpGet<PagedResponse<TItem, TKey>>(path, { ...baseQuery, page, limit })
    const pageItems = ((pageData as unknown as Record<string, unknown>)[key as unknown as string]) as TItem[]
    items.push(...pageItems)
  }
  return { items, meta: { total } }
}