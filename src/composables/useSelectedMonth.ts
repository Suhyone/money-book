import { computed, ref } from 'vue'
import { addMonths, currentMonthKey, type MonthKey } from '@/lib/dates'

// เดือนที่กำลังดู ใช้ร่วมกันทุกหน้า (เลื่อนเดือนที่หน้าหลักแล้วไปหน้าสรุปจะเป็นเดือนเดียวกัน)
const month = ref<MonthKey>(currentMonthKey())

export function useSelectedMonth() {
  return {
    month,
    isCurrent: computed(() => month.value === currentMonthKey()),
    shift(delta: number) {
      month.value = addMonths(month.value, delta)
    },
    reset() {
      month.value = currentMonthKey()
    },
  }
}
