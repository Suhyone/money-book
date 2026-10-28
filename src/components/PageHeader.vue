<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import { useGoBack } from '@/composables/useGoBack'

/** back = หน้าที่จะกลับไปถ้าเปิดหน้านี้ตรงๆ (ไม่มีประวัติให้ย้อน) */
defineProps<{ title: string; back?: string }>()
const goBack = useGoBack()
</script>

<template>
  <header class="page-header">
    <button
      v-if="back !== undefined"
      type="button"
      class="icon-btn"
      aria-label="ย้อนกลับ"
      @click="goBack(back)"
    >
      <ChevronLeft :size="26" />
    </button>
    <h1 class="grow ellipsis">{{ title }}</h1>
    <slot />
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin: 0 -8px;
}

h1 {
  padding-left: 4px;
  font-size: 1.25rem;
}
</style>
