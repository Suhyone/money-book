import type { ISODate } from './lib/dates'
import type { Satang } from './lib/money'
import type { Schedule } from './lib/recurring'

export type TxType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: TxType
  /** emoji */
  icon: string
  /** สี hex เช่น #f97316 */
  color: string
  order: number
  /** ซ่อนจากตัวเลือก แต่รายการเก่ายังอ้างถึงได้ */
  archived: boolean
}

export interface Transaction {
  id: string
  type: TxType
  amount: Satang
  categoryId: string
  date: ISODate
  note: string
  /** id ของรายการประจำที่สร้างรายการนี้ (null = บันทึกเอง) */
  recurringId: string | null
  createdAt: number
  updatedAt: number
}

export type TransactionInput = Pick<Transaction, 'type' | 'amount' | 'categoryId' | 'date' | 'note'>

export interface Budget {
  categoryId: string
  /** งบต่อเดือน */
  monthlyLimit: Satang
}

export interface RecurringRule extends Schedule {
  id: string
  type: TxType
  amount: Satang
  categoryId: string
  note: string
  active: boolean
  /** สร้างรายการถึงวันไหนแล้ว (null = ยังไม่เคยสร้าง) */
  lastGeneratedDate: ISODate | null
  createdAt: number
  updatedAt: number
}

export type RecurringInput = Omit<
  RecurringRule,
  'id' | 'lastGeneratedDate' | 'createdAt' | 'updatedAt'
>

export interface MetaEntry {
  key: string
  value: unknown
}
