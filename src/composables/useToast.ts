import { reactive } from 'vue'

export type ToastTone = 'info' | 'success' | 'warn' | 'danger'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
  action?: { label: string; run: () => void }
}

export const toasts = reactive<Toast[]>([])
let nextId = 1

export function showToast(
  message: string,
  options: { tone?: ToastTone; action?: Toast['action']; duration?: number } = {},
): void {
  const toast: Toast = {
    id: nextId++,
    message,
    tone: options.tone ?? 'info',
    action: options.action,
  }
  toasts.push(toast)
  if (toasts.length > 3) toasts.shift()
  setTimeout(() => dismissToast(toast.id), options.duration ?? (options.action ? 6000 : 3500))
}

export function dismissToast(id: number): void {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}
