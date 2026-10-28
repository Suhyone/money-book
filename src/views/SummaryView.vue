<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import DonutChart from '@/components/DonutChart.vue'
import MonthSwitcher from '@/components/MonthSwitcher.vue'
import TrendChart from '@/components/TrendChart.vue'
import TypeToggle from '@/components/TypeToggle.vue'
import { useCategoryLookup } from '@/composables/useCategories'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useSelectedMonth } from '@/composables/useSelectedMonth'
import { listTransactionsBetween } from '@/db/transactions'
import { addMonths, formatShortMonth, monthKeyOf, monthRange } from '@/lib/dates'
import { formatBaht } from '@/lib/money'
import { totals, totalsByCategory, totalsByMonth } from '@/lib/summary'
import type { TxType } from '@/types'

const TREND_MONTHS = 6

const { month } = useSelectedMonth()
const type = ref<TxType>('expense')
const categoryOf = useCategoryLookup()

const months = computed(() =>
  Array.from({ length: TREND_MONTHS }, (_, i) => addMonths(month.value, i - (TREND_MONTHS - 1))),
)
// ดึงทีเดียว 6 เดือน ใช้ทั้งโดนัท (เดือนที่เลือก) และกราฟแท่ง
const rows = useLiveQuery(
  () =>
    listTransactionsBetween(
      monthRange(addMonths(month.value, -(TREND_MONTHS - 1))).start,
      monthRange(month.value).end,
    ),
  [month],
)

const monthRows = computed(() =>
  (rows.value ?? []).filter((t) => monthKeyOf(t.date) === month.value),
)
const monthTotals = computed(() => totals(monthRows.value))
const typeTotal = computed(() =>
  type.value === 'income' ? monthTotals.value.income : monthTotals.value.expense,
)

const breakdown = computed(() =>
  totalsByCategory(monthRows.value, type.value).map((row) => {
    const category = categoryOf.value(row.categoryId)
    return {
      ...row,
      category,
      percent: typeTotal.value > 0 ? Math.round((row.amount / typeTotal.value) * 100) : 0,
    }
  }),
)

const donutItems = computed(() =>
  breakdown.value.map((b) => ({
    label: b.category.name,
    value: b.amount,
    color: b.category.color,
  })),
)

const trend = computed(() => {
  const perMonth = totalsByMonth(rows.value ?? [], months.value)
  return {
    labels: months.value.map(formatShortMonth),
    income: perMonth.map((t) => t.income),
    expense: perMonth.map((t) => t.expense),
  }
})
</script>

<template>
  <main class="page">
    <MonthSwitcher />
    <TypeToggle v-model="type" />

    <section class="card stack">
      <template v-if="breakdown.length > 0">
        <DonutChart :items="donutItems">
          <div>
            <div class="muted small">{{ type === 'income' ? 'รายรับรวม' : 'รายจ่ายรวม' }}</div>
            <strong class="amount total">{{ formatBaht(typeTotal) }}</strong>
          </div>
        </DonutChart>
        <ul class="legend">
          <li v-for="b in breakdown" :key="b.categoryId">
            <CategoryIcon :icon="b.category.icon" :color="b.category.color" :size="32" />
            <span class="grow ellipsis">{{ b.category.name }}</span>
            <span class="muted small">{{ b.percent }}%</span>
            <strong class="amount">{{ formatBaht(b.amount) }}</strong>
          </li>
        </ul>
      </template>
      <p v-else-if="rows" class="empty">
        ยังไม่มี{{ type === 'income' ? 'รายรับ' : 'รายจ่าย' }}ในเดือนนี้
      </p>
    </section>

    <h2 class="section-title">เทียบ {{ TREND_MONTHS }} เดือนล่าสุด</h2>
    <section class="card">
      <TrendChart v-bind="trend" />
    </section>
  </main>
</template>

<style scoped>
.total {
  font-size: 1.25rem;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
