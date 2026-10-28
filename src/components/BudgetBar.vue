<script setup lang="ts">
import { computed } from 'vue'
import { budgetLevel, budgetPercent } from '@/lib/budget'

const props = defineProps<{ spent: number; limit: number }>()
const level = computed(() => budgetLevel(props.spent, props.limit))
const percent = computed(() => budgetPercent(props.spent, props.limit))
</script>

<template>
  <div
    class="budget-bar"
    :class="level"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="fill" :style="{ width: `${Math.min(percent, 100)}%` }" />
  </div>
</template>

<style scoped>
.budget-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-2);
}

.fill {
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
  transition: width 0.3s;
}

.warn .fill {
  background: var(--warn);
}

.over .fill {
  background: var(--danger);
}
</style>
