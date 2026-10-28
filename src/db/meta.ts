import { db } from './db'

/** ค่าตั้งค่าเล็กๆ ที่ต้องอยู่คู่กับข้อมูล (เช่น วันที่สำรองล่าสุด) */
export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}
