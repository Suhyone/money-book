<script setup lang="ts">
import type { TxType } from '@/types'

const model = defineModel<TxType>({ required: true })
</script>

<template>
  <div class="segmented" role="radiogroup" aria-label="ประเภท">
    <button
      type="button"
      role="radio"
      class="expense"
      :class="{ active: model === 'expense' }"
      :aria-checked="model === 'expense'"
      @click="model = 'expense'"
    >
      รายจ่าย
    </button>
    <button
      type="button"
      role="radio"
      class="income"
      :class="{ active: model === 'income' }"
      :aria-checked="model === 'income'"
      @click="model = 'income'"
    >
      รายรับ
    </button>
  </div>
</template>
