<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

const props = defineProps<{ invalid?: boolean; autofocus?: boolean }>()
const model = defineModel<string>({ required: true })
const input = useTemplateRef('input')

onMounted(() => {
  if (props.autofocus) input.value?.focus()
})
</script>

<template>
  <label class="amount-input" :class="{ invalid }">
    <span class="currency" aria-hidden="true">฿</span>
    <input
      ref="input"
      v-model="model"
      type="text"
      inputmode="decimal"
      enterkeyhint="done"
      autocomplete="off"
      placeholder="0.00"
      aria-label="จำนวนเงิน"
    />
  </label>
</template>

<style scoped>
.amount-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.amount-input:focus-within {
  border-color: var(--primary);
}

.amount-input.invalid {
  border-color: var(--danger);
}

.currency {
  color: var(--muted);
  font-size: 1.6rem;
}

input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
