<script setup lang="ts">
import { Repeat } from 'lucide-vue-next'
import { computed } from 'vue'
import { formatDayHeader, todayISO } from '@/lib/dates'
import { formatBaht } from '@/lib/money'
import { groupByDate } from '@/lib/summary'
import type { Category, Transaction } from '@/types'
import CategoryIcon from './CategoryIcon.vue'

const props = defineProps<{
  transactions: Transaction[]
  categoryOf: (id: string) => Category
}>()

const groups = computed(() => groupByDate(props.transactions))
const today = todayISO()
</script>

<template>
  <section v-for="group in groups" :key="group.date" class="day">
    <header class="day-header">
      <span>{{ formatDayHeader(group.date, today) }}</span>
      <span class="amount" :class="group.net >= 0 ? 'income' : 'expense'">
        {{ group.net >= 0 ? '+' : '−' }}{{ formatBaht(Math.abs(group.net)) }}
      </span>
    </header>
    <div class="list">
      <RouterLink
        v-for="t in group.items"
        :key="t.id"
        :to="{ name: 'edit', params: { id: t.id } }"
        class="list-row"
      >
        <CategoryIcon
          :icon="categoryOf(t.categoryId).icon"
          :color="categoryOf(t.categoryId).color"
        />
        <div class="grow">
          <div class="ellipsis">{{ categoryOf(t.categoryId).name }}</div>
          <div v-if="t.note || t.recurringId" class="muted small ellipsis">
            <Repeat v-if="t.recurringId" :size="12" aria-label="รายการประจำ" />
            {{ t.note }}
          </div>
        </div>
        <strong class="amount" :class="t.type">
          {{ t.type === 'income' ? '+' : '−' }}{{ formatBaht(t.amount) }}
        </strong>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
