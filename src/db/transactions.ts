import { monthRange, type ISODate, type MonthKey } from '@/lib/dates'
import { byNewest } from '@/lib/summary'
import type { Transaction, TransactionInput } from '@/types'
import { db } from './db'

/** รายการในช่วงวันที่ (รวมหัวท้าย) เรียงใหม่สุดก่อน */
export async function listTransactionsBetween(
  start: ISODate,
  end: ISODate,
): Promise<Transaction[]> {
  const rows = await db.transactions.where('date').between(start, end, true, true).toArray()
  return rows.sort(byNewest)
}

export function listTransactionsInMonth(month: MonthKey): Promise<Transaction[]> {
  const { start, end } = monthRange(month)
  return listTransactionsBetween(start, end)
}

export function getTransaction(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id)
}

export async function addTransaction(input: TransactionInput): Promise<string> {
  const now = Date.now()
  const id = crypto.randomUUID()
  await db.transactions.add({ ...input, id, recurringId: null, createdAt: now, updatedAt: now })
  return id
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  await db.transactions.update(id, { ...input, updatedAt: Date.now() })
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

/** ใช้กับปุ่ม "เลิกทำ" หลังลบ */
export async function restoreTransaction(transaction: Transaction): Promise<void> {
  await db.transactions.put(transaction)
}
