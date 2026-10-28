<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { exportBackupFile } from '@/composables/useBackupActions'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getLastBackupAt } from '@/db/backup'
import { db } from '@/db/db'

const DAY = 24 * 60 * 60 * 1000
const REMIND_AFTER_DAYS = 30
/** ยังไม่เคยสำรองเลย: เตือนเมื่อมีข้อมูลพอสมควรแล้ว */
const REMIND_AFTER_COUNT = 20
const SNOOZE_KEY = 'backupReminderSnoozedUntil'

const state = useLiveQuery(async () => {
  const [count, lastBackupAt] = await Promise.all([db.transactions.count(), getLastBackupAt()])
  return { count, lastBackupAt }
})
const snoozedUntil = ref(readSnooze())

const daysSinceBackup = computed(() => {
  const last = state.value?.lastBackupAt
  return last ? Math.floor((Date.now() - Date.parse(last)) / DAY) : null
})

const visible = computed(() => {
  if (!state.value || snoozedUntil.value > Date.now()) return false
  if (daysSinceBackup.value === null) return state.value.count >= REMIND_AFTER_COUNT
  return state.value.count > 0 && daysSinceBackup.value >= REMIND_AFTER_DAYS
})

function readSnooze(): number {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0)
  } catch {
    return 0
  }
}

function snooze() {
  snoozedUntil.value = Date.now() + 7 * DAY
  try {
    localStorage.setItem(SNOOZE_KEY, String(snoozedUntil.value))
  } catch {
    // เก็บไม่ได้ก็แค่เตือนอีกครั้งรอบหน้า
  }
}
</script>

<template>
  <div v-if="visible" class="banner warn" role="status">
    <TriangleAlert :size="22" class="banner-icon" />
    <div class="grow">
      <strong v-if="daysSinceBackup === null">ยังไม่เคยสำรองข้อมูล</strong>
      <strong v-else>ไม่ได้สำรองข้อมูลมา {{ daysSinceBackup }} วันแล้ว</strong>
      <p class="small">ข้อมูลอยู่ในเครื่องนี้เท่านั้น ถ้าลบแอปหรือเปลี่ยนมือถือข้อมูลจะหาย</p>
      <div class="banner-actions">
        <button type="button" class="btn btn-primary" @click="exportBackupFile">สำรองเลย</button>
        <button type="button" class="btn btn-ghost" @click="snooze">ไว้ทีหลัง</button>
      </div>
    </div>
  </div>
</template>
