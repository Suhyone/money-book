import { computed, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const installEvent = ref<BeforeInstallPromptEvent | null>(null)

/** Android/Chrome จะส่ง event มาเมื่อพร้อมให้ติดตั้ง เก็บไว้ให้กดปุ่มติดตั้งทีหลัง (เรียกครั้งเดียวตอนเริ่มแอป) */
export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installEvent.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    installEvent.value = null
  })
}

export function useInstallPrompt() {
  return {
    canPrompt: computed(() => installEvent.value !== null),
    async promptInstall() {
      const event = installEvent.value
      if (!event) return
      await event.prompt()
      await event.userChoice
      installEvent.value = null
    },
  }
}

/** เปิดจากไอคอนบนหน้าจอโฮม (ไม่ได้เปิดในแท็บเบราว์เซอร์) */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOS(): boolean {
  const ua = navigator.userAgent
  // iPad รุ่นใหม่แจ้งตัวเป็น Mac แต่มีจอสัมผัส
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

export interface StorageInfo {
  /** null = เบราว์เซอร์ไม่รองรับการตรวจ */
  persisted: boolean | null
  usage: number | null
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const storage = navigator.storage
  const [persisted, estimate] = await Promise.all([
    storage?.persisted ? storage.persisted().catch(() => null) : null,
    storage?.estimate ? storage.estimate().catch(() => null) : null,
  ])
  return { persisted, usage: estimate?.usage ?? null }
}

/** ขอให้เบราว์เซอร์ไม่ลบข้อมูลเองเมื่อพื้นที่เครื่องใกล้เต็ม */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
