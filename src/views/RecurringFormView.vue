<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AmountInput from '@/components/AmountInput.vue'
import CategoryPicker from '@/components/CategoryPicker.vue'
import PageHeader from '@/components/PageHeader.vue'
import TypeToggle from '@/components/TypeToggle.vue'
import { useCategories } from '@/composables/useCategories'
import { useGoBack } from '@/composables/useGoBack'
import { showToast } from '@/composables/useToast'
import {
  addRecurring,
  deleteRecurring,
  generateDueTransactions,
  getRecurring,
  updateRecurring,
} from '@/db/recurring'
import { formatDate, isValidISODate, MONTHS_TH, todayISO, WEEKDAYS_TH } from '@/lib/dates'
import { parseBaht, satangToInput } from '@/lib/money'
import {
  nextOccurrence,
  occurrencesBetween,
  scheduleDefaults,
  type Frequency,
  type Schedule,
} from '@/lib/recurring'
import type { RecurringInput, TxType } from '@/types'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const goBack = useGoBack()
const today = todayISO()

const type = ref<TxType>('expense')
const amountText = ref('')
const categoryId = ref('')
const note = ref('')
const active = ref(true)
const frequency = ref<Frequency>('monthly')
const startDate = ref(today)
const hasEnd = ref(false)
const endDate = ref(today)
const defaults = scheduleDefaults(today)
const weekday = ref(defaults.weekday)
const dayOfMonth = ref(defaults.dayOfMonth)
const month = ref(defaults.month)
/** ผู้ใช้เลือกวันเองแล้ว → เปลี่ยนวันเริ่มจะไม่ทับค่าที่เลือก */
const scheduleTouched = ref(false)
const loaded = ref(!props.id)
const saving = ref(false)

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'ทุกสัปดาห์' },
  { value: 'monthly', label: 'ทุกเดือน' },
  { value: 'yearly', label: 'ทุกปี' },
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const categories = useCategories()
const options = computed(() =>
  (categories.value ?? []).filter(
    (c) => c.type === type.value && (!c.archived || c.id === categoryId.value),
  ),
)

watch(
  [type, options],
  () => {
    if (!loaded.value || options.value.some((c) => c.id === categoryId.value)) return
    categoryId.value = options.value[0]?.id ?? ''
  },
  { immediate: true },
)

watch(startDate, (value) => {
  if (scheduleTouched.value || !isValidISODate(value)) return
  const d = scheduleDefaults(value)
  weekday.value = d.weekday
  dayOfMonth.value = d.dayOfMonth
  month.value = d.month
})

onMounted(async () => {
  if (!props.id) return
  const rule = await getRecurring(props.id)
  if (!rule) {
    showToast('ไม่พบรายการประจำนี้', { tone: 'warn' })
    void router.replace('/recurring')
    return
  }
  scheduleTouched.value = true
  type.value = rule.type
  amountText.value = satangToInput(rule.amount)
  categoryId.value = rule.categoryId
  note.value = rule.note
  active.value = rule.active
  frequency.value = rule.frequency
  startDate.value = rule.startDate
  hasEnd.value = rule.endDate !== null
  endDate.value = rule.endDate ?? rule.startDate
  weekday.value = rule.weekday
  dayOfMonth.value = rule.dayOfMonth
  month.value = rule.month
  loaded.value = true
})

const amount = computed(() => parseBaht(amountText.value))
const schedule = computed<Schedule>(() => ({
  frequency: frequency.value,
  weekday: weekday.value,
  dayOfMonth: dayOfMonth.value,
  month: month.value,
  startDate: startDate.value,
  endDate: hasEnd.value ? endDate.value : null,
}))
const datesValid = computed(
  () =>
    isValidISODate(startDate.value) &&
    (!hasEnd.value || (isValidISODate(endDate.value) && endDate.value >= startDate.value)),
)
const next = computed(() => (datesValid.value ? nextOccurrence(schedule.value, today) : null))
/** เพิ่มใหม่โดยวันเริ่มอยู่ในอดีต → จะสร้างรายการย้อนหลังกี่รายการ */
const backfillCount = computed(() =>
  !props.id && active.value && datesValid.value
    ? occurrencesBetween(schedule.value, null, today).length
    : 0,
)
const canSave = computed(
  () =>
    loaded.value &&
    !saving.value &&
    !!amount.value &&
    options.value.some((c) => c.id === categoryId.value) &&
    datesValid.value,
)

async function save() {
  if (!canSave.value || amount.value === null) return
  saving.value = true
  try {
    const input: RecurringInput = {
      ...schedule.value,
      type: type.value,
      amount: amount.value,
      categoryId: categoryId.value,
      note: note.value.trim(),
      active: active.value,
    }
    if (props.id) await updateRecurring(props.id, input)
    else await addRecurring(input)
    const created = await generateDueTransactions()
    showToast(created > 0 ? `บันทึกแล้ว · สร้างรายการให้ ${created} รายการ` : 'บันทึกแล้ว', {
      tone: 'success',
    })
    goBack('/recurring')
  } catch (err) {
    console.error(err)
    showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง', { tone: 'danger' })
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!props.id || !window.confirm('ลบรายการประจำนี้? (รายการที่บันทึกไปแล้วจะยังอยู่)')) return
  await deleteRecurring(props.id)
  showToast('ลบรายการประจำแล้ว')
  goBack('/recurring')
}
</script>

<template>
  <main class="page no-nav">
    <PageHeader :title="id ? 'แก้ไขรายการประจำ' : 'เพิ่มรายการประจำ'" back="/recurring">
      <button
        v-if="id"
        type="button"
        class="icon-btn danger"
        aria-label="ลบรายการประจำ"
        @click="remove"
      >
        <Trash2 :size="20" />
      </button>
    </PageHeader>

    <form class="form" @submit.prevent="save">
      <TypeToggle v-model="type" />
      <AmountInput v-model="amountText" />

      <label class="field">
        <span>ชื่อรายการ</span>
        <input
          v-model="note"
          type="text"
          class="input"
          maxlength="200"
          placeholder="เช่น ค่าเช่าห้อง, Netflix, เงินเดือน"
        />
      </label>

      <div class="field">
        <span>หมวดหมู่</span>
        <CategoryPicker v-model="categoryId" :categories="options" />
      </div>

      <div class="field">
        <span>ความถี่</span>
        <div class="segmented">
          <button
            v-for="f in FREQUENCIES"
            :key="f.value"
            type="button"
            :class="{ active: frequency === f.value }"
            @click="frequency = f.value"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <label v-if="frequency === 'weekly'" class="field">
        <span>ทุกวัน</span>
        <select v-model.number="weekday" class="input" @change="scheduleTouched = true">
          <option v-for="(name, index) in WEEKDAYS_TH" :key="name" :value="index">
            {{ name }}
          </option>
        </select>
      </label>

      <div v-else class="schedule-row">
        <label class="field">
          <span>วันที่</span>
          <select v-model.number="dayOfMonth" class="input" @change="scheduleTouched = true">
            <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <label v-if="frequency === 'yearly'" class="field">
          <span>เดือน</span>
          <select v-model.number="month" class="input" @change="scheduleTouched = true">
            <option v-for="(name, index) in MONTHS_TH" :key="name" :value="index + 1">
              {{ name }}
            </option>
          </select>
        </label>
      </div>
      <p v-if="frequency !== 'weekly' && dayOfMonth > 28" class="small muted">
        เดือนที่ไม่มีวันที่ {{ dayOfMonth }} จะใช้วันสุดท้ายของเดือนแทน
      </p>

      <label class="field">
        <span>เริ่มตั้งแต่</span>
        <input v-model="startDate" type="date" class="input" required />
      </label>

      <label class="toggle-row">
        <span class="grow">มีวันสิ้นสุด</span>
        <span class="switch">
          <input v-model="hasEnd" type="checkbox" />
          <span />
        </span>
      </label>
      <label v-if="hasEnd" class="field">
        <span>สิ้นสุดวันที่</span>
        <input v-model="endDate" type="date" class="input" :min="startDate" />
      </label>

      <label class="toggle-row">
        <span class="grow">เปิดใช้งาน</span>
        <span class="switch">
          <input v-model="active" type="checkbox" />
          <span />
        </span>
      </label>

      <div class="card small stack">
        <span v-if="!datesValid" class="error">วันสิ้นสุดต้องไม่ก่อนวันเริ่ม</span>
        <span v-else-if="next"
          >ครั้งถัดไป: <strong>{{ formatDate(next) }}</strong></span
        >
        <span v-else class="muted">ไม่มีกำหนดครั้งถัดไป (สิ้นสุดแล้ว)</span>
        <span v-if="backfillCount > 0" class="muted">
          วันเริ่มเป็นวันที่ผ่านมาแล้ว จะบันทึกย้อนหลังให้ {{ backfillCount }} รายการ
        </span>
      </div>

      <div class="save-bar">
        <button type="submit" class="btn btn-primary btn-block" :disabled="!canSave">บันทึก</button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.schedule-row {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  gap: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  padding: 0 4px;
  font-weight: 600;
}
</style>
