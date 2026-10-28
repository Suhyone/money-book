import { Dexie, type EntityTable } from 'dexie'
import type { Budget, Category, MetaEntry, RecurringRule, Transaction } from '@/types'
import { DEFAULT_CATEGORIES } from './defaults'

/**
 * ฐานข้อมูลในเครื่อง (IndexedDB) — ข้อมูลอยู่ในมือถือแต่ละเครื่องเท่านั้น
 *
 * กติกาแก้โครงสร้างในอนาคต: ห้ามแก้ db.version(1) ที่ปล่อยใช้งานไปแล้ว
 * ให้เพิ่ม db.version(2).stores({...}).upgrade(tx => ...) ต่อท้ายแทน
 * แล้วเพิ่ม BACKUP_VERSION ใน backup.ts ถ้ารูปแบบไฟล์สำรองเปลี่ยน
 */
export const db = new Dexie('money-book') as Dexie & {
  categories: EntityTable<Category, 'id'>
  transactions: EntityTable<Transaction, 'id'>
  budgets: EntityTable<Budget, 'categoryId'>
  recurring: EntityTable<RecurringRule, 'id'>
  meta: EntityTable<MetaEntry, 'key'>
}

db.version(1).stores({
  categories: 'id, type, order',
  transactions: 'id, date, categoryId, recurringId',
  budgets: 'categoryId',
  recurring: 'id',
  meta: 'key',
})

// เปิดแอปครั้งแรก: ใส่หมวดเริ่มต้นให้
db.on('populate', (tx) => tx.table('categories').bulkAdd(DEFAULT_CATEGORIES))
