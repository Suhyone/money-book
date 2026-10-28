<script setup lang="ts">
import { dismissToast, toasts, type Toast } from '@/composables/useToast'

function runAction(toast: Toast) {
  toast.action?.run()
  dismissToast(toast.id)
}
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.tone" role="status">
        <span class="grow">{{ toast.message }}</span>
        <button v-if="toast.action" type="button" class="action" @click="runAction(toast)">
          {{ toast.action.label }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  right: 0;
  bottom: calc(var(--nav-height) + var(--safe-bottom) + 16px);
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 528px;
  padding: 12px 14px;
  border-left: 4px solid var(--primary);
  border-radius: 12px;
  background: #1f2925;
  color: #f2f7f4;
  box-shadow: 0 8px 24px rgb(0 0 0 / 20%);
  font-size: 0.92rem;
  pointer-events: auto;
}

.toast.warn {
  border-left-color: #f59e0b;
}

.toast.danger {
  border-left-color: #f87171;
}

.action {
  border: none;
  background: none;
  color: #6ee7b7;
  font-weight: 700;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
