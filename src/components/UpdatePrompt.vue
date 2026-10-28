<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000

// มี service worker ตัวใหม่รออยู่ (deploy เวอร์ชันใหม่แล้ว) → แสดงแถบให้กดอัปเดต
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => {
      if (navigator.onLine) void registration.update()
    }
    setInterval(check, UPDATE_CHECK_INTERVAL)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})
</script>

<template>
  <div v-if="needRefresh" class="update-prompt" role="alert">
    <RefreshCw :size="20" />
    <span class="grow">มีเวอร์ชันใหม่ของแอป</span>
    <button type="button" class="btn btn-ghost" @click="needRefresh = false">ภายหลัง</button>
    <button type="button" class="btn btn-primary" @click="updateServiceWorker()">อัปเดต</button>
  </div>
</template>

<style scoped>
.update-prompt {
  position: fixed;
  top: calc(8px + var(--safe-top));
  right: 12px;
  left: 12px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 536px;
  margin: 0 auto;
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 8px 24px rgb(0 0 0 / 15%);
}

.btn {
  min-height: 38px;
  padding: 6px 12px;
}
</style>
