<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import CategoryIcon from '@/components/CategoryIcon.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useCategoryLookup } from '@/composables/useCategories'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { showToast } from '@/composables/useToast'
import { generateDueTransactions, listRecurring, updateRecurring } from '@/db/recurring'
import { formatDate, todayISO } from '@/lib/dates'
import { formatBaht } from '@/lib/money'
import { describeSchedule, nextOccurrence } from '@/lib/recurring'
import type { RecurringRule } from '@/types'

const rules = useLiveQuery(() => listRecurring())
const categoryOf = useCategoryLookup()
const today = todayISO()

function nextText(rule: RecurringRule): string {
  if (!rule.active) return 'พักไว้'
  const next = nextOccurrence(rule, today)
  return next ? `ครั้งถัดไป ${formatDate(next)}` : 'สิ้นสุดแล้ว'
}

async function setActive(rule: RecurringRule, active: boolean) {
  await updateRecurring(rule.id, { ...rule, active })
  if (!active) return
  const created = await generateDueTransactions()
  if (created > 0) showToast(`บันทึกรายการประจำให้ ${created} รายการ`, { tone: 'success' })
}
</script>

<template>
  <main class="page">
    <PageHeader title="รายการประจำ" back="/more" />
    <p class="small muted">
      รายการที่เกิดซ้ำ เช่น ค่าเช่า ค่าเน็ต เงินเดือน — แอปจะบันทึกให้อัตโนมัติเมื่อถึงกำหนด
      (ตอนเปิดแอป)
    </p>

    <div v-if="rules && rules.length > 0" class="list">
      <div v-for="rule in rules" :key="rule.id" class="list-row" :class="{ paused: !rule.active }">
        <RouterLink :to="{ name: 'recurring-edit', params: { id: rule.id } }" class="rule">
          <CategoryIcon
            :icon="categoryOf(rule.categoryId).icon"
            :color="categoryOf(rule.categoryId).color"
          />
          <div class="grow">
            <div class="row">
              <span class="ellipsis">{{ rule.note || categoryOf(rule.categoryId).name }}</span>
              <strong class="amount" :class="rule.type">
                {{ rule.type === 'income' ? '+' : '−' }}{{ formatBaht(rule.amount) }}
              </strong>
            </div>
            <div class="small muted ellipsis">
              {{ describeSchedule(rule) }} · {{ nextText(rule) }}
            </div>
          </div>
        </RouterLink>
        <label class="switch">
          <input
            type="checkbox"
            :checked="rule.active"
            :aria-label="rule.active ? 'พักรายการนี้' : 'เปิดใช้งานรายการนี้'"
            @change="setActive(rule, ($event.target as HTMLInputElement).checked)"
          />
          <span />
        </label>
      </div>
    </div>
    <p v-else-if="rules" class="empty">ยังไม่มีรายการประจำ</p>

    <RouterLink :to="{ name: 'recurring-new' }" class="btn btn-primary btn-block">
      <Plus :size="20" /> เพิ่มรายการประจำ
    </RouterLink>
  </main>
</template>

<style scoped>
.rule {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.paused .rule {
  opacity: 0.55;
}
</style>
