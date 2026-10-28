import { isValidISODate } from '@/lib/dates'
import type { Budget, Category, RecurringRule, Transaction, TxType } from '@/types'
import { db } from './db'
import { DEFAULT_CATEGORIES } from './defaults'
import { getMeta, setMeta } from './meta'

/** เพิ่มเลขนี้เมื่อรูปแบบไฟล์สำรองเปลี่ยน (คู่กับ db.version ใหม่) */
export const BACKUP_VERSION = 1

export interface BackupData {
  app: 'money-book'
  version: number
  exportedAt: string
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  recurring: RecurringRule[]
}

export type RestoreMode = 'merge' | 'replace'

export async function createBackup(): Promise<BackupData> {
  const [categories, transactions, budgets, recurring] = await Promise.all([
    db.categories.toArray(),
    db.transactions.toArray(),
    db.budgets.toArray(),
    db.recurring.toArray(),
  ])
  return {
    app: 'money-book',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories,
    transactions,
    budgets,
    recurring,
  }
}

// ---------- ตรวจไฟล์ก่อนกู้คืน (ไฟล์อาจถูกแก้มือหรือมาจากแอปอื่น) ----------

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isAmount = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0
const isType = (v: unknown): v is TxType => v === 'income' || v === 'expense'
const isDate = (v: unknown) => isStr(v) && isValidISODate(v)
const isIntIn = (v: unknown, min: number, max: number) =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max

const validators = {
  categories: (v: Obj) =>
    isStr(v.id) &&
    isStr(v.name) &&
    isType(v.type) &&
    isStr(v.icon) &&
    isStr(v.color) &&
    isNum(v.order) &&
    typeof v.archived === 'boolean',
  transactions: (v: Obj) =>
    isStr(v.id) &&
    isType(v.type) &&
    isAmount(v.amount) &&
    isStr(v.categoryId) &&
    isDate(v.date) &&
    isStr(v.note) &&
    (v.recurringId === null || isStr(v.recurringId)) &&
    isNum(v.createdAt) &&
    isNum(v.updatedAt),
  budgets: (v: Obj) => isStr(v.categoryId) && isAmount(v.monthlyLimit),
  recurring: (v: Obj) =>
    isStr(v.id) &&
    isType(v.type) &&
    isAmount(v.amount) &&
    isStr(v.categoryId) &&
    isStr(v.note) &&
    typeof v.active === 'boolean' &&
    (v.frequency === 'weekly' || v.frequency === 'monthly' || v.frequency === 'yearly') &&
    isIntIn(v.weekday, 0, 6) &&
    isIntIn(v.dayOfMonth, 1, 31) &&
    isIntIn(v.month, 1, 12) &&
    isDate(v.startDate) &&
    (v.endDate === null || isDate(v.endDate)) &&
    (v.lastGeneratedDate === null || isDate(v.lastGeneratedDate)) &&
    isNum(v.createdAt) &&
    isNum(v.updatedAt),
}

const TABLE_LABELS: Record<keyof typeof validators, string> = {
  categories: 'หมวดหมู่',
  transactions: 'รายการ',
  budgets: 'งบประมาณ',
  recurring: 'รายการประจำ',
}

/** แปลงข้อความในไฟล์เป็นข้อมูลสำรอง ถ้าไม่ถูกต้องจะ throw Error พร้อมข้อความภาษาไทย */
export function parseBackup(text: string): BackupData {
  let data: unknown
  try {
    data = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    throw new Error('อ่านไฟล์ไม่ได้ ไฟล์อาจเสียหรือไม่ใช่ไฟล์ .json')
  }
  if (!isObj(data) || data.app !== 'money-book' || !Number.isInteger(data.version)) {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของแอปนี้')
  }
  if ((data.version as number) > BACKUP_VERSION) {
    throw new Error('ไฟล์นี้มาจากแอปเวอร์ชันใหม่กว่า กรุณาอัปเดตแอปก่อนแล้วลองใหม่')
  }
  for (const key of Object.keys(validators) as (keyof typeof validators)[]) {
    const rows = data[key]
    if (!Array.isArray(rows)) throw new Error(`ไฟล์ไม่มีข้อมูล${TABLE_LABELS[key]}`)
    const bad = rows.findIndex((row) => !isObj(row) || !validators[key](row))
    if (bad !== -1) throw new Error(`ข้อมูล${TABLE_LABELS[key]}ลำดับที่ ${bad + 1} ไม่ถูกต้อง`)
  }
  return data as unknown as BackupData
}

/** เลือกตัวที่แก้ไขล่าสุดระหว่างข้อมูลในเครื่องกับในไฟล์ */
function newerOf<T extends { updatedAt: number }>(incoming: T[], current: (T | undefined)[]): T[] {
  return incoming.filter((row, i) => {
    const local = current[i]
    return !local || row.updatedAt >= local.updatedAt
  })
}

/**
 * merge: เพิ่มข้อมูลจากไฟล์เข้าไป (id ซ้ำจะเก็บตัวที่แก้ไขล่าสุด)
 * replace: ลบข้อมูลในเครื่องทั้งหมดแล้วใช้ข้อมูลจากไฟล์แทน
 */
export async function restoreBackup(data: BackupData, mode: RestoreMode): Promise<void> {
  await db.transaction(
    'rw',
    [db.categories, db.transactions, db.budgets, db.recurring],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.categories.clear(),
          db.transactions.clear(),
          db.budgets.clear(),
          db.recurring.clear(),
        ])
        await db.categories.bulkAdd(data.categories)
        await db.transactions.bulkAdd(data.transactions)
        await db.budgets.bulkAdd(data.budgets)
        await db.recurring.bulkAdd(data.recurring)
        return
      }
      const [localTx, localRules] = await Promise.all([
        db.transactions.bulkGet(data.transactions.map((t) => t.id)),
        db.recurring.bulkGet(data.recurring.map((r) => r.id)),
      ])
      await db.categories.bulkPut(data.categories)
      await db.budgets.bulkPut(data.budgets)
      await db.transactions.bulkPut(newerOf(data.transactions, localTx))
      await db.recurring.bulkPut(newerOf(data.recurring, localRules))
    },
  )
}

const LAST_BACKUP_KEY = 'lastBackupAt'

/** เวลา (ISO) ที่สำรองข้อมูลล่าสุด */
export function getLastBackupAt(): Promise<string | undefined> {
  return getMeta<string>(LAST_BACKUP_KEY)
}

export function markBackedUp(at: Date = new Date()): Promise<void> {
  return setMeta(LAST_BACKUP_KEY, at.toISOString())
}

/** ล้างทุกอย่างแล้วเริ่มใหม่ด้วยหมวดเริ่มต้น */
export async function resetAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.categories, db.transactions, db.budgets, db.recurring, db.meta],
    async () => {
      await Promise.all(db.tables.map((table) => table.clear()))
      await db.categories.bulkAdd(DEFAULT_CATEGORIES)
    },
  )
}
