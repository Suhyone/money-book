import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  BACKUP_VERSION,
  createBackup,
  getLastBackupAt,
  markBackedUp,
  parseBackup,
  resetAllData,
  restoreBackup,
} from '../backup'
import { setBudget } from '../budgets'
import { db } from '../db'
import { DEFAULT_CATEGORIES } from '../defaults'
import { addTransaction, getTransaction, updateTransaction } from '../transactions'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const expense = (amount: number, note = '') => ({
  type: 'expense' as const,
  amount,
  categoryId: 'exp-food',
  date: '2026-10-10',
  note,
})

describe('สำรองและกู้คืน', () => {
  it('สำรองแล้วกู้คืนแบบแทนที่ได้ข้อมูลเดิม', async () => {
    await addTransaction(expense(100))
    await addTransaction(expense(200))
    await setBudget('exp-food', 5000)
    const text = JSON.stringify(await createBackup())

    await resetAllData()
    expect(await db.transactions.count()).toBe(0)

    await restoreBackup(parseBackup(text), 'replace')
    expect(await db.transactions.count()).toBe(2)
    expect(await db.budgets.get('exp-food')).toEqual({ categoryId: 'exp-food', monthlyLimit: 5000 })
    expect(await db.categories.count()).toBe(DEFAULT_CATEGORIES.length)
  })

  it('รวมข้อมูลแล้วเก็บตัวที่แก้ไขล่าสุด', async () => {
    const id = await addTransaction(expense(100, 'เก่า'))
    const backup = await createBackup()

    await new Promise((r) => setTimeout(r, 5))
    await updateTransaction(id, expense(300, 'ใหม่กว่า'))
    await addTransaction(expense(999))

    await restoreBackup(backup, 'merge')
    expect((await getTransaction(id))?.note).toBe('ใหม่กว่า')
    expect(await db.transactions.count()).toBe(2)
  })

  it('บันทึกวันที่สำรองล่าสุด', async () => {
    expect(await getLastBackupAt()).toBeUndefined()
    await markBackedUp(new Date('2026-10-28T10:00:00Z'))
    expect(await getLastBackupAt()).toBe('2026-10-28T10:00:00.000Z')
  })
})

describe('parseBackup ตรวจไฟล์', () => {
  const valid = async () => JSON.parse(JSON.stringify(await createBackup()))

  it('ไฟล์ที่ไม่ใช่ JSON', () => {
    expect(() => parseBackup('not json')).toThrow('อ่านไฟล์ไม่ได้')
  })

  it('ไฟล์ของแอปอื่น', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow('ไม่ใช่ไฟล์สำรองของแอปนี้')
  })

  it('ไฟล์จากเวอร์ชันใหม่กว่า', async () => {
    const data = await valid()
    data.version = BACKUP_VERSION + 1
    expect(() => parseBackup(JSON.stringify(data))).toThrow('เวอร์ชันใหม่กว่า')
  })

  it('บอกลำดับรายการที่เสีย', async () => {
    await addTransaction(expense(100))
    const data = await valid()
    data.transactions[0].amount = 1.5
    expect(() => parseBackup(JSON.stringify(data))).toThrow('ข้อมูลรายการลำดับที่ 1 ไม่ถูกต้อง')
  })

  it('รับไฟล์ที่มี BOM นำหน้า', async () => {
    expect(parseBackup('﻿' + JSON.stringify(await valid())).app).toBe('money-book')
  })
})
