<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AmountInput from '@/components/AmountInput.vue'
import CategoryPicker from '@/components/CategoryPicker.vue'
import PageHeader from '@/components/PageHeader.vue'
import TypeToggle from '@/components/TypeToggle.vue'
import { useCategories } from '@/composables/useCategories'
import { useGoBack } from '@/composables/useGoBack'
import { useSelectedMonth } from '@/composables/useSelectedMonth'
import { showToast } from '@/composables/useToast'
import { saveWithBudgetCheck } from '@/db/budgets'
import { getMeta, setMeta } from '@/db/meta'
import {
  addTransaction,
  deleteTransaction,
  getTransaction,
  restoreTransaction,
  updateTransaction,
} from '@/db/transactions'
import { budgetPercent } from '@/lib/budget'
import { isValidISODate, monthKeyOf, todayISO } from '@/lib/dates'
import { formatBaht, parseBaht, satangToInput } from '@/lib/money'
import type { Transaction, TransactionInput, TxType } from '@/types'

/** มี id = แก้ไขรายการเดิม, ไม่มี = เพิ่มใหม่ */
const props = defineProps<{ id?: string }>()

const route = useRoute()
const router = useRouter()
const goBack = useGoBack()
const { month: selectedMonth, isCurrent } = useSelectedMonth()

const type = ref<TxType>(route.query.type === 'income' ? 'income' : 'expense')
const amountText = ref('')
const categoryId = ref('')
// ดูเดือนอื่นอยู่แล้วกด + → ตั้งวันที่เป็นวันแรกของเดือนนั้น
const date = ref(isCurrent.value ? todayISO() : `${selectedMonth.value}-01`)
const note = ref('')
// shallowRef: ใช้เขียนกลับลง IndexedDB ตอนกด "เลิกทำ" จึงต้องไม่เป็น Proxy
const original = shallowRef<Transaction>()
const loaded = ref(!props.id)
const saving = ref(false)

const categories = useCategories()
const options = computed(() =>
  (categories.value ?? []).filter(
    (c) => c.type === type.value && (!c.archived || c.id === categoryId.value),
  ),
)

const amount = computed(() => parseBaht(amountText.value))
const amountInvalid = computed(
  () => amountText.value.trim() !== '' && (amount.value === null || amount.value === 0),
)
const canSave = computed(
  () =>
    loaded.value &&
    !saving.value &&
    !!amount.value &&
    options.value.some((c) => c.id === categoryId.value) &&
    isValidISODate(date.value),
)

const lastCategoryKey = (t: TxType) => `lastCategory.${t}`

onMounted(async () => {
  if (!props.id) return
  const transaction = await getTransaction(props.id)
  if (!transaction) {
    showToast('ไม่พบรายการนี้', { tone: 'warn' })
    void router.replace('/')
    return
  }
  original.value = transaction
  type.value = transaction.type
  amountText.value = satangToInput(transaction.amount)
  categoryId.value = transaction.categoryId
  date.value = transaction.date
  note.value = transaction.note
  loaded.value = true
})

// เลือกหมวดให้อัตโนมัติ: หมวดที่ใช้ล่าสุดของประเภทนั้น
watch(
  [type, options],
  async () => {
    if (!loaded.value || options.value.length === 0) return
    if (options.value.some((c) => c.id === categoryId.value)) return
    const last = await getMeta<string>(lastCategoryKey(type.value))
    categoryId.value = options.value.find((c) => c.id === last)?.id ?? options.value[0]?.id ?? ''
  },
  { immediate: true },
)

async function save() {
  if (!canSave.value || amount.value === null) return
  saving.value = true
  try {
    const input: TransactionInput = {
      type: type.value,
      amount: amount.value,
      categoryId: categoryId.value,
      date: date.value,
      note: note.value.trim(),
    }
    const id = props.id
    const alert = await saveWithBudgetCheck(input.categoryId, monthKeyOf(input.date), () =>
      id ? updateTransaction(id, input) : addTransaction(input),
    )
    await setMeta(lastCategoryKey(input.type), input.categoryId)
    selectedMonth.value = monthKeyOf(input.date)

    const name = options.value.find((c) => c.id === input.categoryId)?.name ?? ''
    if (alert?.level === 'over') {
      showToast(
        `หมวด “${name}” เกินงบแล้ว: ${formatBaht(alert.spent)} จาก ${formatBaht(alert.limit)}`,
        {
          tone: 'danger',
          duration: 6000,
        },
      )
    } else if (alert?.level === 'warn') {
      showToast(`หมวด “${name}” ใช้ไป ${budgetPercent(alert.spent, alert.limit)}% ของงบแล้ว`, {
        tone: 'warn',
        duration: 6000,
      })
    } else {
      showToast(id ? 'แก้ไขแล้ว' : 'บันทึกแล้ว', { tone: 'success' })
    }
    goBack('/')
  } catch (err) {
    console.error(err)
    showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง', { tone: 'danger' })
  } finally {
    saving.value = false
  }
}

async function remove() {
  const transaction = original.value
  if (!transaction || !window.confirm('ลบรายการนี้?')) return
  await deleteTransaction(transaction.id)
  showToast('ลบแล้ว', {
    action: { label: 'เลิกทำ', run: () => void restoreTransaction(transaction) },
  })
  goBack('/')
}
</script>

<template>
  <main class="page no-nav">
    <PageHeader :title="id ? 'แก้ไขรายการ' : 'เพิ่มรายการ'" back="/">
      <button
        v-if="original"
        type="button"
        class="icon-btn danger"
        aria-label="ลบรายการ"
        @click="remove"
      >
        <Trash2 :size="20" />
      </button>
    </PageHeader>

    <form class="form" @submit.prevent="save">
      <TypeToggle v-model="type" />

      <div class="field">
        <AmountInput v-model="amountText" :invalid="amountInvalid" :autofocus="!id" />
        <p v-if="amountInvalid" class="error small">
          กรอกจำนวนเงินมากกว่า 0 และทศนิยมไม่เกิน 2 ตำแหน่ง
        </p>
      </div>

      <div class="field">
        <span>หมวดหมู่</span>
        <CategoryPicker v-model="categoryId" :categories="options" />
      </div>

      <label class="field">
        <span>วันที่</span>
        <input v-model="date" type="date" class="input" required />
      </label>

      <label class="field">
        <span>บันทึกช่วยจำ</span>
        <input
          v-model="note"
          type="text"
          class="input"
          maxlength="200"
          placeholder="เช่น ข้าวมันไก่, ค่าน้ำมัน"
          enterkeyhint="done"
        />
      </label>

      <p v-if="original?.recurringId" class="muted small">รายการนี้บันทึกอัตโนมัติจากรายการประจำ</p>

      <div class="save-bar">
        <button type="submit" class="btn btn-primary btn-block" :disabled="!canSave">บันทึก</button>
      </div>
    </form>
  </main>
</template>
