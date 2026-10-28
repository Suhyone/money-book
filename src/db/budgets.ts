import { crossedLevel } from '@/lib/budget'
import { monthRange, type MonthKey } from '@/lib/dates'
import type { Satang } from '@/lib/money'
import type { Budget } from '@/types'
import { db } from './db'

export function listBudgets(): Promise<Budget[]> {
  return db.budgets.toArray()
}

export async function getBudgetLimit(categoryId: string): Promise<Satang> {
  return (await db.budgets.get(categoryId))?.monthlyLimit ?? 0
}

/** monthlyLimit = 0 คือยกเลิกงบของหมวดนั้น */
export async function setBudget(categoryId: string, monthlyLimit: Satang): Promise<void> {
  if (monthlyLimit > 0) await db.budgets.put({ categoryId, monthlyLimit })
  else await db.budgets.delete(categoryId)
}

/** ยอดรายจ่ายของหมวดในเดือนนั้น */
export async function spentInMonth(categoryId: string, month: MonthKey): Promise<Satang> {
  const { start, end } = monthRange(month)
  let spent = 0
  await db.transactions
    .where('date')
    .between(start, end, true, true)
    .each((t) => {
      if (t.type === 'expense' && t.categoryId === categoryId) spent += t.amount
    })
  return spent
}

export interface BudgetAlert {
  level: 'warn' | 'over'
  spent: Satang
  limit: Satang
}

/**
 * บันทึกรายการผ่าน save() แล้วตรวจว่าการบันทึกครั้งนี้ทำให้หมวดนั้นข้ามเส้น 80% หรือเกินงบหรือไม่
 * (เทียบยอดก่อน-หลังบันทึก จึงใช้ได้ทั้งเพิ่มใหม่และแก้ไข)
 */
export async function saveWithBudgetCheck(
  categoryId: string,
  month: MonthKey,
  save: () => Promise<unknown>,
): Promise<BudgetAlert | null> {
  const limit = await getBudgetLimit(categoryId)
  const before = limit > 0 ? await spentInMonth(categoryId, month) : 0
  await save()
  if (limit <= 0) return null
  const after = await spentInMonth(categoryId, month)
  const level = crossedLevel(before, after, limit)
  return level ? { level, spent: after, limit } : null
}
