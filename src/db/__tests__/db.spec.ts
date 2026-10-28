import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { todayISO } from '@/lib/dates'
import { scheduleDefaults } from '@/lib/recurring'
import type { RecurringInput, TransactionInput } from '@/types'
import { saveWithBudgetCheck, setBudget } from '../budgets'
import { listCategories, moveCategory } from '../categories'
import { db } from '../db'
import { DEFAULT_CATEGORIES } from '../defaults'
import { addRecurring, generateDueTransactions, updateRecurring } from '../recurring'
import {
  addTransaction,
  deleteTransaction,
  listTransactionsInMonth,
  updateTransaction,
} from '../transactions'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const food = (amount: number, date = '2026-10-10'): TransactionInput => ({
  type: 'expense',
  amount,
  categoryId: 'exp-food',
  date,
  note: '',
})

function monthlyRule(overrides: Partial<RecurringInput> = {}): RecurringInput {
  return {
    type: 'expense',
    amount: 500000,
    categoryId: 'exp-housing',
    note: 'ค่าเช่า',
    active: true,
    frequency: 'monthly',
    weekday: 0,
    dayOfMonth: 5,
    month: 1,
    startDate: '2026-08-01',
    endDate: null,
    ...overrides,
  }
}

describe('ฐานข้อมูล', () => {
  it('เปิดครั้งแรกมีหมวดเริ่มต้น', async () => {
    expect(await listCategories()).toHaveLength(DEFAULT_CATEGORIES.length)
  })

  it('เพิ่ม/แก้/ลบ รายการ และดึงตามเดือน', async () => {
    const id = await addTransaction(food(12000))
    await addTransaction(food(5000, '2026-09-30'))
    expect(await listTransactionsInMonth('2026-10')).toHaveLength(1)

    await updateTransaction(id, food(15000, '2026-10-31'))
    const [updated] = await listTransactionsInMonth('2026-10')
    expect(updated?.amount).toBe(15000)
    expect(updated?.date).toBe('2026-10-31')

    await deleteTransaction(id)
    expect(await listTransactionsInMonth('2026-10')).toHaveLength(0)
  })

  it('เตือนเมื่อข้ามเส้น 80% และเมื่อเกินงบ ครั้งเดียวต่อระดับ', async () => {
    await setBudget('exp-food', 10000)
    const save = (amount: number) =>
      saveWithBudgetCheck('exp-food', '2026-10', () => addTransaction(food(amount)))
    expect(await save(7000)).toBeNull()
    expect((await save(1500))?.level).toBe('warn')
    expect(await save(100)).toBeNull()
    expect(await save(2000)).toEqual({ level: 'over', spent: 10600, limit: 10000 })
    expect(await save(100)).toBeNull()
  })

  it('เลื่อนลำดับหมวด', async () => {
    await moveCategory('exp-transport', -1)
    const expense = (await listCategories()).filter((c) => c.type === 'expense')
    expect(expense.slice(0, 2).map((c) => c.id)).toEqual(['exp-transport', 'exp-food'])
  })
})

describe('รายการประจำ', () => {
  it('สร้างย้อนหลังครบ และไม่สร้างซ้ำ', async () => {
    const ruleId = await addRecurring(monthlyRule())
    expect(await generateDueTransactions('2026-10-28')).toBe(3)
    expect(await generateDueTransactions('2026-10-28')).toBe(0)

    const october = await listTransactionsInMonth('2026-10')
    expect(october).toHaveLength(1)
    expect(october[0]).toMatchObject({ date: '2026-10-05', amount: 500000, recurringId: ruleId })

    expect(await generateDueTransactions('2026-11-05')).toBe(1)
  })

  it('ลบรายการที่สร้างแล้วจะไม่ถูกสร้างกลับมา', async () => {
    const ruleId = await addRecurring(monthlyRule())
    await generateDueTransactions('2026-10-28')
    await deleteTransaction(`${ruleId}:2026-10-05`)
    expect(await generateDueTransactions('2026-10-28')).toBe(0)
  })

  it('กฎที่ปิดไว้ไม่สร้าง และเปิดใหม่ไม่ย้อนสร้างช่วงที่พัก', async () => {
    const today = todayISO()
    const weeklyToday = monthlyRule({
      frequency: 'weekly',
      ...scheduleDefaults(today),
      startDate: '2026-01-01',
      active: false,
    })
    const ruleId = await addRecurring(weeklyToday)
    expect(await generateDueTransactions(today)).toBe(0)

    await updateRecurring(ruleId, { ...weeklyToday, active: true })
    expect(await generateDueTransactions(today)).toBe(1)
  })
})
