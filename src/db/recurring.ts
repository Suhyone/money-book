import { addDays, todayISO, type ISODate } from '@/lib/dates'
import { occurrencesBetween } from '@/lib/recurring'
import type { RecurringInput, RecurringRule, Transaction } from '@/types'
import { db } from './db'

export async function listRecurring(): Promise<RecurringRule[]> {
  const rules = await db.recurring.toArray()
  return rules.sort((a, b) => a.createdAt - b.createdAt)
}

export function getRecurring(id: string): Promise<RecurringRule | undefined> {
  return db.recurring.get(id)
}

/** ถ้าวันเริ่มเป็นวันที่ผ่านมาแล้ว generateDueTransactions จะสร้างรายการย้อนหลังให้ */
export async function addRecurring(input: RecurringInput): Promise<string> {
  const now = Date.now()
  const id = crypto.randomUUID()
  await db.recurring.add({ ...input, id, lastGeneratedDate: null, createdAt: now, updatedAt: now })
  return id
}

export async function updateRecurring(id: string, input: RecurringInput): Promise<void> {
  const existing = await db.recurring.get(id)
  if (!existing) return
  const yesterday = addDays(todayISO(), -1)
  let lastGeneratedDate = existing.lastGeneratedDate
  // แก้กำหนดการแล้วให้วันนี้คำนวณใหม่ (id คงที่ จึงไม่สร้างซ้ำถ้าวันนี้สร้างไปแล้ว)
  if (lastGeneratedDate !== null && lastGeneratedDate > yesterday) lastGeneratedDate = yesterday
  // เปิดใช้งานใหม่หลังพักไว้: ไม่ย้อนสร้างช่วงที่พัก แต่ยังสร้างของวันนี้
  const resumed = input.active && !existing.active
  if (resumed && (lastGeneratedDate === null || lastGeneratedDate < yesterday)) {
    lastGeneratedDate = yesterday
  }
  await db.recurring.put({ ...existing, ...input, lastGeneratedDate, updatedAt: Date.now() })
}

/** ลบเฉพาะกฎ รายการที่สร้างไปแล้วยังอยู่ */
export async function deleteRecurring(id: string): Promise<void> {
  await db.recurring.delete(id)
}

/** id ของรายการที่สร้างจากกฎ — คงที่ จึงสร้างซ้ำไม่ได้แม้เรียกหลายรอบ */
export const generatedId = (ruleId: string, date: ISODate) => `${ruleId}:${date}`

/** สร้างรายการของกฎที่ถึงกำหนดจนถึงวันนี้ คืนจำนวนรายการที่สร้างใหม่ */
export async function generateDueTransactions(today: ISODate = todayISO()): Promise<number> {
  return db.transaction('rw', db.recurring, db.transactions, async () => {
    let created = 0
    const now = Date.now()
    for (const rule of await db.recurring.toArray()) {
      if (!rule.active) continue
      const dates = occurrencesBetween(rule, rule.lastGeneratedDate, today)
      if (dates.length > 0) {
        const existing = await db.transactions.bulkGet(dates.map((d) => generatedId(rule.id, d)))
        const fresh: Transaction[] = dates
          .filter((_, i) => !existing[i])
          .map((date) => ({
            id: generatedId(rule.id, date),
            type: rule.type,
            amount: rule.amount,
            categoryId: rule.categoryId,
            date,
            note: rule.note,
            recurringId: rule.id,
            createdAt: now,
            updatedAt: now,
          }))
        await db.transactions.bulkAdd(fresh)
        created += fresh.length
      }
      if (rule.lastGeneratedDate === null || rule.lastGeneratedDate < today) {
        await db.recurring.update(rule.id, { lastGeneratedDate: today })
      }
    }
    return created
  })
}
