import { liveQuery, type Subscription } from 'dexie'
import { onScopeDispose, shallowRef, watch, type ShallowRef, type WatchSource } from 'vue'

/**
 * ผูกผลลัพธ์ของ Dexie query เข้ากับ Vue — ข้อมูลในฐานเปลี่ยนเมื่อไร หน้าจออัปเดตเอง
 * deps: ค่าที่ query ใช้ (เช่นเดือนที่เลือก) เปลี่ยนเมื่อไรจะ query ใหม่
 * ระหว่างโหลดครั้งแรกค่าเป็น undefined
 */
export function useLiveQuery<T>(
  query: () => Promise<T>,
  deps: WatchSource<unknown>[] = [],
): ShallowRef<T | undefined> {
  const result = shallowRef<T>()
  let subscription: Subscription | undefined

  watch(
    deps,
    () => {
      subscription?.unsubscribe()
      subscription = liveQuery(query).subscribe({
        next: (value) => {
          result.value = value
        },
        error: (err) => console.error('useLiveQuery', err),
      })
    },
    { immediate: true },
  )

  onScopeDispose(() => subscription?.unsubscribe())
  return result
}
