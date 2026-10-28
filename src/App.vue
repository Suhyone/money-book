<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import ToastHost from '@/components/ToastHost.vue'
import UpdatePrompt from '@/components/UpdatePrompt.vue'
import { isStandalone, requestPersistentStorage } from '@/composables/usePwa'
import { showToast } from '@/composables/useToast'
import { db } from '@/db/db'
import { generateDueTransactions } from '@/db/recurring'

const route = useRoute()
const fatalError = ref('')

// สร้างรายการประจำที่ถึงกำหนด ทั้งตอนเปิดแอปและตอนสลับกลับมาที่แอป (เช่นเปิดค้างไว้ข้ามวัน)
async function runRecurring() {
  try {
    const created = await generateDueTransactions()
    if (created > 0)
      showToast(`บันทึกรายการประจำให้อัตโนมัติ ${created} รายการ`, { tone: 'success' })
  } catch (err) {
    console.error(err)
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') void runRecurring()
}

onMounted(async () => {
  try {
    await db.open()
  } catch (err) {
    console.error(err)
    fatalError.value =
      'เบราว์เซอร์นี้ไม่อนุญาตให้เก็บข้อมูล (อาจเปิดในโหมดส่วนตัว/ไม่ระบุตัวตน) ลองเปิดในโหมดปกติ'
    return
  }
  void runRecurring()
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (isStandalone()) void requestPersistentStorage()
})

onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibilityChange))
</script>

<template>
  <main v-if="fatalError" class="page">
    <p class="banner warn">{{ fatalError }}</p>
  </main>
  <template v-else>
    <RouterView />
    <BottomNav v-if="!route.meta.hideNav" />
  </template>
  <UpdatePrompt />
  <ToastHost />
</template>
