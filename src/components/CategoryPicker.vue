<script setup lang="ts">
import type { Category } from '@/types'
import CategoryIcon from './CategoryIcon.vue'

defineProps<{ categories: Category[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="picker" role="radiogroup" aria-label="หมวดหมู่">
    <button
      v-for="c in categories"
      :key="c.id"
      type="button"
      role="radio"
      class="chip"
      :class="{ selected: model === c.id }"
      :style="{ '--c': c.color }"
      :aria-checked="model === c.id"
      :aria-label="c.name"
      @click="model = c.id"
    >
      <CategoryIcon :icon="c.icon" :color="c.color" :size="36" />
      <span>{{ c.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 8px;
}

.chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 86px;
  padding: 10px 4px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  font-size: 0.78rem;
  line-height: 1.25;
  text-align: center;
}

.chip.selected {
  border-color: var(--c);
  background: color-mix(in srgb, var(--c) 12%, var(--surface));
  font-weight: 600;
}
</style>
