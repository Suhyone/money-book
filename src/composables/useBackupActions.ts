import { createBackup, markBackedUp } from '@/db/backup'
import { db } from '@/db/db'
import { transactionsToCsv } from '@/lib/csv'
import { todayISO } from '@/lib/dates'
import { shareOrDownload } from '@/lib/share'
import { showToast } from './useToast'

/** สำรองทุกอย่างเป็นไฟล์ .json (ใช้กู้คืนหรือย้ายเครื่อง) */
export async function exportBackupFile(): Promise<void> {
  try {
    const data = await createBackup()
    const file = new File([JSON.stringify(data)], `money-book-backup-${todayISO()}.json`, {
      type: 'application/json',
    })
    if ((await shareOrDownload(file)) === 'cancelled') return
    await markBackedUp()
    showToast('สำรองข้อมูลแล้ว เก็บไฟล์ไว้ในที่ปลอดภัย เช่น Google Drive', { tone: 'success' })
  } catch (err) {
    console.error(err)
    showToast('สำรองข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง', { tone: 'danger' })
  }
}

/** รายการทั้งหมดเป็น .csv เปิดด้วย Excel / Google Sheets ได้ */
export async function exportCsvFile(): Promise<void> {
  try {
    const [transactions, categories] = await Promise.all([
      db.transactions.orderBy('date').toArray(),
      db.categories.toArray(),
    ])
    const names = new Map(categories.map((c) => [c.id, c.name]))
    const csv = transactionsToCsv(
      transactions.map((t) => ({
        date: t.date,
        type: t.type,
        categoryName: names.get(t.categoryId) ?? '',
        amount: t.amount,
        note: t.note,
      })),
    )
    const file = new File([csv], `money-book-${todayISO()}.csv`, { type: 'text/csv' })
    await shareOrDownload(file)
  } catch (err) {
    console.error(err)
    showToast('Export ไม่สำเร็จ ลองใหม่อีกครั้ง', { tone: 'danger' })
  }
}
