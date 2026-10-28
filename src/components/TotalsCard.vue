<script setup lang="ts">
import { formatBaht } from '@/lib/money'
import type { Totals } from '@/lib/summary'

defineProps<{ totals: Totals }>()
</script>

<template>
  <section class="card totals" aria-label="สรุปยอดเดือนนี้">
    <div class="balance">
      <span class="muted small">คงเหลือ</span>
      <strong class="amount" :class="{ expense: totals.balance < 0 }">
        {{ formatBaht(totals.balance) }}
      </strong>
    </div>
    <div class="split">
      <div>
        <span class="muted small">รายรับ</span>
        <strong class="amount income">{{ formatBaht(totals.income) }}</strong>
      </div>
      <div>
        <span class="muted small">รายจ่าย</span>
        <strong class="amount expense">{{ formatBaht(totals.expense) }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.totals {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.balance,
.split > div {
  display: flex;
  flex-direction: column;
}

.balance strong {
  font-size: 1.9rem;
  line-height: 1.2;
}

.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.split strong {
  font-size: 1.1rem;
}
</style>
