import type { ISODate } from './dates'
import { satangToDecimal, type Satang } from './money'
import type { TxType } from '@/types'

/** BOM ทำให้ Excel รู้ว่าไฟล์เป็น UTF-8 ภาษาไทยจึงไม่เพี้ยน */
export const UTF8_BOM = '﻿'

export function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** กัน Excel ตีความข้อความที่ขึ้นต้นด้วย = + - @ เป็นสูตร (CSV injection) */
export function neutralizeFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n'
}

export interface CsvTransaction {
  date: ISODate
  type: TxType
  categoryName: string
  amount: Satang
  note: string
}

/** จำนวนเงินรายจ่ายเป็นค่าติดลบ เพื่อให้ SUM ใน Excel ได้ยอดคงเหลือทันที */
export function transactionsToCsv(rows: readonly CsvTransaction[]): string {
  const header = ['วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'บันทึก']
  const body = rows.map((r) => [
    r.date,
    r.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    neutralizeFormula(r.categoryName),
    satangToDecimal(r.type === 'income' ? r.amount : -r.amount),
    neutralizeFormula(r.note),
  ])
  return UTF8_BOM + toCsv([header, ...body])
}
