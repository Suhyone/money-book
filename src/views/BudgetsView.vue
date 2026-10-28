<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import BudgetBar from '@/components/BudgetBar.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import MonthSwitcher from '@/components/MonthSwitcher.vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useSelectedMonth } from '@/composables/useSelectedMonth'
import { showToast } from '@/composables/useToast'
import { listBudgets, setBudget } from '@/db/budgets'
import { listCategories } from '@/db/categories'
import { listTransactionsInMonth } from '@/db/transactions'
import { budgetLevel, budgetPercent } from '@/lib/budget'
import { daysInMonth, todayISO } from '@/lib/dates'
import { formatBaht, parseBaht, satangToInput } from '@/lib/money'
import { totalsByCategory } from '@/lib/summary'
import type { Category } from '@/types'

const { month, isCurrent } = useSelectedMonth()

const data = useLiveQuery(async () => {
  const [categories, budgets, transactions] = await Promise.all([
    listCategories(),
    listBudgets(),
    listTransactionsInMonth(month.value),
  ])
  return { categories, budgets, transactions }
}, [month])

interface Item {
  category: Category
  limit: number
  spent: number
}

const items = computed<Item[]>(() => {
  if (!data.value) return []
  const limits = new Map(data.value.budgets.map((b) => [b.categoryId, b.monthlyLimit]))
  const spent = new Map(
    totalsByCategory(data.value.transactions, 'expense').map((r) => [r.categoryId, r.amount]),
  )
  return (
    data.value.categories
      .filter((c) => c.type === 'expense' && (!c.archived || limits.has(c.id)))
      .map((category) => ({
        category,
        limit: limits.get(category.id) ?? 0,
        spent: spent.get(category.id) ?? 0,
      }))
      // หมวดที่ตั้งงบไว้ขึ้นก่อน (sort แบบ stable จึงยังเรียงตามลำดับหมวดเดิม)
      .sort((a, b) => Number(b.limit > 0) - Number(a.limit > 0))
  )
})

const overall = computed(() => {
  const budgeted = items.value.filter((i) => i.limit > 0)
  const limit = budgeted.reduce((sum, i) => sum + i.limit, 0)
  const spent = budgeted.reduce((sum, i) => sum + i.spent, 0)
  return { limit, spent, remaining: limit - spent }
})

/** เดือนปัจจุบัน: เหลือใช้ได้เฉลี่ยวันละเท่าไรจนสิ้นเดือน */
const perDay = computed(() => {
  if (!isCurrent.value || overall.value.remaining <= 0) return null
  const today = todayISO()
  const lastDay = daysInMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)))
  const daysLeft = lastDay - Number(today.slice(8, 10)) + 1
  return Math.floor(overall.value.remaining / daysLeft)
})

const editingId = ref<string | null>(null)
const editText = ref('')

async function startEdit(item: Item) {
  editingId.value = item.category.id
  editText.value = item.limit > 0 ? satangToInput(item.limit) : ''
  await nextTick()
  document.querySelector<HTMLInputElement>('.edit input')?.focus()
}

async function saveEdit(categoryId: string) {
  const value = editText.value.trim() === '' ? 0 : parseBaht(editText.value)
  if (value === null) {
    showToast('จำนวนเงินไม่ถูกต้อง', { tone: 'warn' })
    return
  }
  await setBudget(categoryId, value)
  editingId.value = null
}

async function removeBudget(categoryId: string) {
  await setBudget(categoryId, 0)
  editingId.value = null
}
</script>

<template>
  <main class="page">
    <MonthSwitcher />

    <section v-if="overall.limit > 0" class="card stack">
      <div class="row muted small"><span>ใช้ไปแล้ว</span><span>งบรวม</span></div>
      <div class="row">
        <strong class="amount big">{{ formatBaht(overall.spent) }}</strong>
        <strong class="amount">{{ formatBaht(overall.limit) }}</strong>
      </div>
      <BudgetBar :spent="overall.spent" :limit="overall.limit" />
      <p v-if="overall.remaining >= 0" class="small muted">
        เหลือใช้ได้อีก {{ formatBaht(overall.remaining) }}
        <template v-if="perDay !== null"> · เฉลี่ยวันละ {{ formatBaht(perDay) }}</template>
      </p>
      <p v-else class="small error">เกินงบรวม {{ formatBaht(-overall.remaining) }}</p>
    </section>
    <p v-else-if="data" class="banner small">
      แตะหมวดที่อยากคุมเพื่อตั้งงบต่อเดือน แอปจะเตือนเมื่อใช้ถึง 80% และเมื่อเกินงบ
    </p>

    <div v-if="items.length > 0" class="list">
      <div v-for="item in items" :key="item.category.id" class="budget-item">
        <button type="button" class="list-row" @click="startEdit(item)">
          <CategoryIcon :icon="item.category.icon" :color="item.category.color" />
          <div class="grow stack-tight">
            <div class="row">
              <span class="ellipsis">{{ item.category.name }}</span>
              <span
                v-if="item.limit > 0"
                class="small amount"
                :class="{
                  error: budgetLevel(item.spent, item.limit) === 'over',
                  warn: budgetLevel(item.spent, item.limit) === 'warn',
                }"
              >
                {{ budgetPercent(item.spent, item.limit) }}%
              </span>
            </div>
            <template v-if="item.limit > 0">
              <BudgetBar :spent="item.spent" :limit="item.limit" />
              <span class="small muted amount">
                {{ formatBaht(item.spent) }} / {{ formatBaht(item.limit) }}
              </span>
            </template>
            <span v-else class="small muted"
              >ยังไม่ตั้งงบ · ใช้ไป {{ formatBaht(item.spent) }}</span
            >
          </div>
        </button>
        <form
          v-if="editingId === item.category.id"
          class="edit"
          @submit.prevent="saveEdit(item.category.id)"
        >
          <input
            v-model="editText"
            class="input"
            inputmode="decimal"
            enterkeyhint="done"
            placeholder="งบต่อเดือน (บาท)"
            aria-label="งบต่อเดือน"
          />
          <button type="submit" class="btn btn-primary">บันทึก</button>
          <button
            v-if="item.limit > 0"
            type="button"
            class="btn btn-danger"
            @click="removeBudget(item.category.id)"
          >
            ลบงบ
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
.big {
  font-size: 1.5rem;
}

.warn {
  color: var(--warn);
}

.budget-item + .budget-item {
  border-top: 1px solid var(--border);
}

.budget-item .list-row {
  border-top: none;
}

.stack-tight {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit {
  display: flex;
  gap: 8px;
  padding: 0 14px 14px 66px;
}

.edit .input {
  flex: 1;
  min-width: 0;
}
</style>
