<script setup lang="ts">
import { ChartPie, Ellipsis, House, Plus, Target } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { key: 'home', to: '/', label: 'หน้าหลัก', icon: House },
  { key: 'summary', to: '/summary', label: 'สรุป', icon: ChartPie },
  { key: 'budgets', to: '/budgets', label: 'งบประมาณ', icon: Target },
  { key: 'more', to: '/more', label: 'เพิ่มเติม', icon: Ellipsis },
] as const
</script>

<template>
  <nav class="bottom-nav" aria-label="เมนูหลัก">
    <template v-for="(tab, index) in tabs" :key="tab.key">
      <RouterLink v-if="index === 2" :to="{ name: 'add' }" class="add" aria-label="เพิ่มรายการ">
        <Plus :size="28" :stroke-width="2.5" />
      </RouterLink>
      <RouterLink :to="tab.to" class="tab" :class="{ active: route.meta.tab === tab.key }">
        <component :is="tab.icon" :size="22" />
        <span>{{ tab.label }}</span>
      </RouterLink>
    </template>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  max-width: 560px;
  height: calc(var(--nav-height) + var(--safe-bottom));
  margin: 0 auto;
  padding-bottom: var(--safe-bottom);
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0;
  color: var(--muted);
  font-size: 0.7rem;
  text-decoration: none;
}

.tab.active {
  color: var(--primary);
  font-weight: 600;
}

.add {
  display: grid;
  place-items: center;
  justify-self: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--on-primary);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 40%, transparent);
  transform: translateY(-14px);
}

.add:active {
  transform: translateY(-14px) scale(0.95);
}
</style>
