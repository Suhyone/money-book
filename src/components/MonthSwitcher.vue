<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useSelectedMonth } from '@/composables/useSelectedMonth'
import { formatMonthLabel } from '@/lib/dates'

const { month, isCurrent, shift, reset } = useSelectedMonth()
</script>

<template>
  <div class="month-switcher">
    <button type="button" class="icon-btn" aria-label="เดือนก่อนหน้า" @click="shift(-1)">
      <ChevronLeft :size="24" />
    </button>
    <button type="button" class="label" :disabled="isCurrent" @click="reset">
      <strong>{{ formatMonthLabel(month) }}</strong>
      <small v-if="!isCurrent">แตะเพื่อกลับเดือนนี้</small>
    </button>
    <button type="button" class="icon-btn" aria-label="เดือนถัดไป" @click="shift(1)">
      <ChevronRight :size="24" />
    </button>
  </div>
</template>

<style scoped>
.month-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
  background: none;
  font-size: 1.15rem;
  line-height: 1.3;
}

.label:disabled {
  cursor: default;
}

.label small {
  color: var(--primary);
  font-size: 0.75rem;
}
</style>
