import { monthKeyOf, type ISODate, type MonthKey } from './dates'
import type { Satang } from './money'
import type { Transaction, TxType } from '@/types'

export interface Totals {
  income: Satang
  expense: Satang
  balance: Satang
}

export function totals(transactions: readonly Transaction[]): Totals {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, balance: income - expense }
}

/** ยอดรวมแยกตามหมวด เรียงจากมากไปน้อย */
export function totalsByCategory(
  transactions: readonly Transaction[],
  type: TxType,
): { categoryId: string; amount: Satang }[] {
  const sums = new Map<string, Satang>()
  for (const t of transactions) {
    if (t.type === type) sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amount)
  }
  return [...sums]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/** จัดกลุ่มรายการตามวัน (ลำดับตามที่ส่งเข้ามา) พร้อมยอดสุทธิของแต่ละวัน */
export function groupByDate(
  transactions: readonly Transaction[],
): { date: ISODate; net: Satang; items: Transaction[] }[] {
  const groups: { date: ISODate; net: Satang; items: Transaction[] }[] = []
  for (const t of transactions) {
    let group = groups[groups.length - 1]
    if (!group || group.date !== t.date) {
      group = { date: t.date, net: 0, items: [] }
      groups.push(group)
    }
    group.items.push(t)
    group.net += t.type === 'income' ? t.amount : -t.amount
  }
  return groups
}

/** ยอดรับ/จ่ายของแต่ละเดือนตาม months ที่ระบุ */
export function totalsByMonth(
  transactions: readonly Transaction[],
  months: readonly MonthKey[],
): Totals[] {
  const index = new Map(months.map((m, i) => [m, i]))
  const result = months.map(() => ({ income: 0, expense: 0, balance: 0 }))
  for (const t of transactions) {
    const i = index.get(monthKeyOf(t.date))
    const bucket = i === undefined ? undefined : result[i]
    if (!bucket) continue
    if (t.type === 'income') bucket.income += t.amount
    else bucket.expense += t.amount
    bucket.balance = bucket.income - bucket.expense
  }
  return result
}

/** เรียงใหม่สุดก่อน (วันที่ใหม่ก่อน วันเดียวกันเอาที่บันทึกทีหลังก่อน) */
export function byNewest(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return b.createdAt - a.createdAt
}
