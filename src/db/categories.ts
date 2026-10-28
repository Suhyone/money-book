import type { Category } from '@/types'
import { db } from './db'

export function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray()
}

export async function addCategory(
  input: Pick<Category, 'name' | 'type' | 'icon' | 'color'>,
): Promise<string> {
  const last = await db.categories.orderBy('order').last()
  const id = crypto.randomUUID()
  await db.categories.add({ ...input, id, order: (last?.order ?? 0) + 1, archived: false })
  return id
}

export async function updateCategory(
  id: string,
  changes: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'archived'>>,
): Promise<void> {
  await db.categories.update(id, changes)
}

/** เลื่อนขึ้น (-1) หรือลง (+1) ในประเภทเดียวกัน แล้วเรียงเลข order ใหม่ให้ต่อเนื่อง */
export async function moveCategory(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    const category = await db.categories.get(id)
    if (!category) return
    const siblings = await db.categories.where('type').equals(category.type).sortBy('order')
    const from = siblings.findIndex((c) => c.id === id)
    const to = from + direction
    if (to < 0 || to >= siblings.length) return
    const [moved] = siblings.splice(from, 1)
    if (!moved) return
    siblings.splice(to, 0, moved)
    const base = Math.min(...siblings.map((c) => c.order))
    await db.categories.bulkUpdate(
      siblings.map((c, i) => ({ key: c.id, changes: { order: base + i } })),
    )
  })
}
