import { computed, type ComputedRef } from 'vue'
import { listCategories } from '@/db/categories'
import type { Category } from '@/types'
import { useLiveQuery } from './useLiveQuery'

export function useCategories() {
  return useLiveQuery(() => listCategories())
}

export const UNKNOWN_CATEGORY: Category = {
  id: '',
  name: 'ไม่ทราบหมวด',
  type: 'expense',
  icon: '❔',
  color: '#64748b',
  order: 0,
  archived: false,
}

/** ค้นหมวดจาก id ได้เร็ว — หมวดที่หาไม่เจอจะได้ UNKNOWN_CATEGORY */
export function useCategoryLookup(): ComputedRef<(id: string) => Category> {
  const categories = useCategories()
  return computed(() => {
    const map = new Map((categories.value ?? []).map((c) => [c.id, c]))
    return (id: string) => map.get(id) ?? UNKNOWN_CATEGORY
  })
}
