<script setup lang="ts">
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import PageHeader from '@/components/PageHeader.vue'
import TypeToggle from '@/components/TypeToggle.vue'
import { useCategories } from '@/composables/useCategories'
import { addCategory, moveCategory, updateCategory } from '@/db/categories'
import type { Category, TxType } from '@/types'

const EMOJIS = [
  '🍜',
  '☕',
  '🍺',
  '🛵',
  '🚗',
  '⛽',
  '🏠',
  '💡',
  '📱',
  '🛒',
  '👕',
  '💄',
  '💊',
  '🏥',
  '🎮',
  '🎬',
  '✈️',
  '📚',
  '🎁',
  '🐶',
  '👶',
  '💳',
  '🧾',
  '🔧',
  '💼',
  '💰',
  '🎉',
  '📈',
  '🏦',
  '🧧',
  '💵',
  '📦',
]
const COLORS = [
  '#f97316',
  '#eab308',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#64748b',
]

const type = ref<TxType>('expense')
const categories = useCategories()
const list = computed(() => (categories.value ?? []).filter((c) => c.type === type.value))

/** id ของหมวดที่กำลังแก้ / 'new' = กำลังเพิ่ม / null = ไม่ได้แก้ */
const editing = ref<string | null>(null)
const form = reactive({ name: '', icon: '', color: '' })

function startAdd() {
  editing.value = 'new'
  Object.assign(form, { name: '', icon: type.value === 'income' ? '💰' : '📦', color: COLORS[0] })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function startEdit(category: Category) {
  editing.value = category.id
  Object.assign(form, { name: category.name, icon: category.icon, color: category.color })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function save() {
  const name = form.name.trim()
  const icon = form.icon.trim() || '📦'
  if (!name || editing.value === null) return
  if (editing.value === 'new') {
    await addCategory({ name, icon, color: form.color, type: type.value })
  } else {
    await updateCategory(editing.value, { name, icon, color: form.color })
  }
  editing.value = null
}
</script>

<template>
  <main class="page">
    <PageHeader title="หมวดหมู่" back="/more" />
    <TypeToggle v-model="type" @update:model-value="editing = null" />

    <form v-if="editing" class="card form" @submit.prevent="save">
      <strong>{{ editing === 'new' ? 'เพิ่มหมวดใหม่' : 'แก้ไขหมวด' }}</strong>
      <div class="preview">
        <CategoryIcon :icon="form.icon || '📦'" :color="form.color" :size="48" />
        <input
          v-model="form.name"
          class="input"
          maxlength="40"
          placeholder="ชื่อหมวด"
          aria-label="ชื่อหมวด"
          required
        />
      </div>
      <div class="field">
        <span>ไอคอน (เลือก หรือพิมพ์อีโมจิเอง)</span>
        <div class="emoji-grid">
          <button
            v-for="emoji in EMOJIS"
            :key="emoji"
            type="button"
            :class="{ selected: form.icon === emoji }"
            @click="form.icon = emoji"
          >
            {{ emoji }}
          </button>
        </div>
        <input v-model="form.icon" class="input emoji-input" maxlength="8" aria-label="อีโมจิ" />
      </div>
      <div class="field">
        <span>สี</span>
        <div class="colors">
          <button
            v-for="color in COLORS"
            :key="color"
            type="button"
            :style="{ background: color }"
            :class="{ selected: form.color === color }"
            :aria-label="`สี ${color}`"
            @click="form.color = color"
          />
        </div>
      </div>
      <div class="row">
        <button type="button" class="btn btn-ghost" @click="editing = null">ยกเลิก</button>
        <button type="submit" class="btn btn-primary grow" :disabled="!form.name.trim()">
          บันทึก
        </button>
      </div>
    </form>

    <div class="list">
      <div
        v-for="(c, index) in list"
        :key="c.id"
        class="list-row"
        :class="{ archived: c.archived }"
      >
        <CategoryIcon :icon="c.icon" :color="c.color" />
        <div class="grow">
          <div class="ellipsis">{{ c.name }}</div>
          <div v-if="c.archived" class="small muted">ซ่อนอยู่ ไม่แสดงตอนบันทึก</div>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="เลื่อนขึ้น"
          :disabled="index === 0"
          @click="moveCategory(c.id, -1)"
        >
          <ArrowUp :size="18" />
        </button>
        <button
          type="button"
          class="icon-btn"
          aria-label="เลื่อนลง"
          :disabled="index === list.length - 1"
          @click="moveCategory(c.id, 1)"
        >
          <ArrowDown :size="18" />
        </button>
        <button type="button" class="icon-btn" aria-label="แก้ไข" @click="startEdit(c)">
          <Pencil :size="18" />
        </button>
        <button
          type="button"
          class="icon-btn"
          :aria-label="c.archived ? 'แสดงหมวดนี้' : 'ซ่อนหมวดนี้'"
          @click="updateCategory(c.id, { archived: !c.archived })"
        >
          <Eye v-if="c.archived" :size="18" />
          <EyeOff v-else :size="18" />
        </button>
      </div>
    </div>

    <button type="button" class="btn btn-primary btn-block" @click="startAdd">
      <Plus :size="20" /> เพิ่มหมวด{{ type === 'income' ? 'รายรับ' : 'รายจ่าย' }}
    </button>
  </main>
</template>

<style scoped>
.list-row {
  gap: 4px;
  padding-right: 6px;
}

.list-row > .grow {
  margin-left: 8px;
}

.list-row .icon-btn {
  width: 36px;
  height: 36px;
}

.icon-btn:disabled {
  opacity: 0.25;
}

.archived .category-icon,
.archived .grow {
  opacity: 0.5;
}

.preview {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-grid button {
  aspect-ratio: 1;
  border: 1.5px solid transparent;
  border-radius: 10px;
  background: var(--surface-2);
  font-size: 1.25rem;
}

.emoji-grid button.selected {
  border-color: var(--primary);
}

.emoji-input {
  width: 96px;
  text-align: center;
}

.colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.colors button {
  width: 32px;
  height: 32px;
  border: 3px solid var(--surface);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--border);
}

.colors button.selected {
  box-shadow: 0 0 0 2px var(--text);
}
</style>
