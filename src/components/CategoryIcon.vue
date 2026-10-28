<script setup lang="ts">
withDefaults(defineProps<{ icon: string; color: string; size?: number }>(), { size: 40 })
</script>

<template>
  <span class="category-icon" :style="{ '--c': color, '--s': `${size}px` }" aria-hidden="true">
    {{ icon }}
  </span>
</template>

<style scoped>
.category-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: color-mix(in srgb, var(--c) 18%, transparent);
  font-size: calc(var(--s) * 0.5);
  line-height: 1;
}
</style>
