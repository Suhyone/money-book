import type { Satang } from './money'

/** ok = ปกติ, warn = ใช้ไปตั้งแต่ 80% (ใกล้เกิน), over = เกินงบ */
export type BudgetLevel = 'ok' | 'warn' | 'over'

const RANK: Record<BudgetLevel, number> = { ok: 0, warn: 1, over: 2 }

export function budgetLevel(spent: Satang, limit: Satang): BudgetLevel {
  if (limit <= 0) return 'ok'
  if (spent > limit) return 'over'
  // เทียบแบบจำนวนเต็ม (spent >= 80% ของ limit) กันทศนิยมเพี้ยน
  if (spent * 10 >= limit * 8) return 'warn'
  return 'ok'
}

/** เปอร์เซ็นต์ที่ใช้ไป (ปัดเป็นจำนวนเต็ม) */
export function budgetPercent(spent: Satang, limit: Satang): number {
  return limit > 0 ? Math.round((spent / limit) * 100) : 0
}

/** ถ้าการบันทึกครั้งนี้ทำให้ระดับแย่ลง (ข้ามเส้น 80% หรือเกินงบ) คืนระดับใหม่ ไม่งั้นคืน null */
export function crossedLevel(before: Satang, after: Satang, limit: Satang): 'warn' | 'over' | null {
  const next = budgetLevel(after, limit)
  if (next === 'ok' || RANK[next] <= RANK[budgetLevel(before, limit)]) return null
  return next
}
