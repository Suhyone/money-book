import type { Category } from '@/types'

/** หมวดเริ่มต้น — ใช้ id คงที่ เพื่อให้ไฟล์สำรองจากต่างเครื่องรวมกันได้ไม่ซ้ำ */
export const DEFAULT_CATEGORIES: Category[] = [
  ['exp-food', 'อาหาร/เครื่องดื่ม', '🍜', '#f97316'],
  ['exp-transport', 'เดินทาง', '🚌', '#0ea5e9'],
  ['exp-housing', 'ที่พัก/ค่าเช่า', '🏠', '#8b5cf6'],
  ['exp-utilities', 'ค่าน้ำ/ค่าไฟ', '💡', '#eab308'],
  ['exp-phone', 'โทรศัพท์/อินเทอร์เน็ต', '📱', '#06b6d4'],
  ['exp-shopping', 'ของใช้/ช้อปปิ้ง', '🛒', '#ec4899'],
  ['exp-health', 'สุขภาพ', '💊', '#ef4444'],
  ['exp-fun', 'บันเทิง', '🎮', '#a855f7'],
  ['exp-education', 'การศึกษา', '📚', '#3b82f6'],
  ['exp-gift', 'ของขวัญ/ทำบุญ', '🎁', '#f43f5e'],
  ['exp-other', 'อื่นๆ', '📦', '#64748b'],
  ['inc-salary', 'เงินเดือน', '💼', '#059669'],
  ['inc-extra', 'รายได้เสริม', '💰', '#10b981'],
  ['inc-bonus', 'โบนัส', '🎉', '#22c55e'],
  ['inc-invest', 'ดอกเบี้ย/ลงทุน', '📈', '#14b8a6'],
  ['inc-other', 'อื่นๆ', '🧧', '#64748b'],
].map(([id = '', name = '', icon = '', color = ''], order): Category => ({
  id,
  name,
  icon,
  color,
  order,
  type: id.startsWith('inc-') ? 'income' : 'expense',
  archived: false,
}))
