<script setup lang="ts">
import {
  ArchiveRestore,
  ChevronRight,
  DatabaseBackup,
  FileSpreadsheet,
  Repeat,
  ShieldCheck,
  Tags,
  Trash2,
} from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import InstallHint from '@/components/InstallHint.vue'
import { exportBackupFile, exportCsvFile } from '@/composables/useBackupActions'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getStorageInfo, requestPersistentStorage, type StorageInfo } from '@/composables/usePwa'
import { showToast } from '@/composables/useToast'
import {
  getLastBackupAt,
  parseBackup,
  resetAllData,
  restoreBackup,
  type BackupData,
  type RestoreMode,
} from '@/db/backup'

const version = __APP_VERSION__
const buildTime = new Date(__BUILD_TIME__).toLocaleString('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const lastBackupAt = useLiveQuery(() => getLastBackupAt())
const lastBackupText = computed(() =>
  lastBackupAt.value
    ? new Date(lastBackupAt.value).toLocaleString('th-TH', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : 'ยังไม่เคยสำรอง',
)

// ---------- กู้คืน ----------
const fileInput = useTemplateRef('fileInput')
// shallowRef: ข้อมูลที่จะเขียนลง IndexedDB ต้องเป็น object ธรรมดา (Proxy ของ ref() clone ไม่ได้)
const pending = shallowRef<{ fileName: string; data: BackupData } | null>(null)
const restoring = ref(false)

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    pending.value = { fileName: file.name, data: parseBackup(await file.text()) }
    await nextTick()
    document
      .querySelector('.import-confirm')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'อ่านไฟล์ไม่ได้', { tone: 'danger' })
  }
}

async function restore(mode: RestoreMode) {
  if (!pending.value) return
  if (
    mode === 'replace' &&
    !window.confirm('ข้อมูลในเครื่องนี้จะถูกแทนที่ด้วยข้อมูลในไฟล์ทั้งหมด แน่ใจไหม?')
  ) {
    return
  }
  restoring.value = true
  try {
    await restoreBackup(pending.value.data, mode)
    pending.value = null
    showToast('กู้คืนข้อมูลแล้ว', { tone: 'success' })
  } catch (err) {
    console.error(err)
    showToast('กู้คืนไม่สำเร็จ ข้อมูลเดิมยังอยู่ครบ', { tone: 'danger' })
  } finally {
    restoring.value = false
  }
}

// ---------- พื้นที่จัดเก็บ ----------
const storage = ref<StorageInfo>({ persisted: null, usage: null })
onMounted(async () => {
  storage.value = await getStorageInfo()
})

const usageText = computed(() => {
  const bytes = storage.value.usage
  if (bytes === null) return null
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
})

async function persist() {
  const granted = await requestPersistentStorage()
  storage.value = await getStorageInfo()
  showToast(
    granted
      ? 'เบราว์เซอร์จะเก็บข้อมูลไว้ถาวรแล้ว'
      : 'เบราว์เซอร์ยังไม่อนุญาต ลองติดตั้งเป็นแอปก่อน',
    { tone: granted ? 'success' : 'warn' },
  )
}

// ---------- ล้างข้อมูล ----------
async function reset() {
  if (!window.confirm('ล้างข้อมูลทั้งหมดในเครื่องนี้? (ควรสำรองข้อมูลก่อน)')) return
  if (!window.confirm('ยืนยันอีกครั้ง: ลบรายการ งบ และรายการประจำทั้งหมด กู้คืนไม่ได้')) return
  await resetAllData()
  showToast('ล้างข้อมูลแล้ว')
}
</script>

<template>
  <main class="page">
    <h1 class="page-title">เพิ่มเติม</h1>
    <InstallHint />

    <h2 class="section-title">จัดการ</h2>
    <nav class="list">
      <RouterLink to="/recurring" class="list-row">
        <Repeat :size="22" class="lead" />
        <span class="grow">รายการประจำ</span>
        <ChevronRight :size="20" class="muted" />
      </RouterLink>
      <RouterLink to="/categories" class="list-row">
        <Tags :size="22" class="lead" />
        <span class="grow">หมวดหมู่</span>
        <ChevronRight :size="20" class="muted" />
      </RouterLink>
    </nav>

    <h2 class="section-title">สำรองข้อมูล</h2>
    <section class="card stack">
      <p class="small">
        ข้อมูลทั้งหมดอยู่ในเครื่องนี้เท่านั้น ถ้าลบแอปหรือเปลี่ยนมือถือข้อมูลจะหาย
        ควรสำรองเป็นไฟล์เก็บไว้เป็นระยะ เช่นส่งเข้า LINE ตัวเอง หรือเก็บใน Google Drive
      </p>
      <p class="small muted">สำรองล่าสุด: {{ lastBackupText }}</p>
      <button type="button" class="btn btn-primary btn-block" @click="exportBackupFile">
        <DatabaseBackup :size="20" /> สำรองข้อมูล (.json)
      </button>
      <button type="button" class="btn btn-block" @click="fileInput?.click()">
        <ArchiveRestore :size="20" /> กู้คืนจากไฟล์สำรอง
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json,text/plain"
        hidden
        @change="onFileChosen"
      />
      <button type="button" class="btn btn-block" @click="exportCsvFile">
        <FileSpreadsheet :size="20" /> Export ไปใช้ใน Excel (.csv)
      </button>
    </section>

    <section v-if="pending" class="card stack import-confirm">
      <strong>กู้คืนจาก {{ pending.fileName }}</strong>
      <p class="small muted">
        สำรองเมื่อ {{ new Date(pending.data.exportedAt).toLocaleString('th-TH') }} ·
        {{ pending.data.transactions.length }} รายการ ·
        {{ pending.data.recurring.length }} รายการประจำ
      </p>
      <button
        type="button"
        class="btn btn-primary btn-block"
        :disabled="restoring"
        @click="restore('merge')"
      >
        รวมกับข้อมูลในเครื่อง
      </button>
      <button
        type="button"
        class="btn btn-danger btn-block"
        :disabled="restoring"
        @click="restore('replace')"
      >
        แทนที่ข้อมูลในเครื่องทั้งหมด
      </button>
      <button type="button" class="btn btn-ghost btn-block" @click="pending = null">ยกเลิก</button>
    </section>

    <h2 class="section-title">พื้นที่จัดเก็บ</h2>
    <section class="card stack small">
      <div class="row">
        <span>เก็บข้อมูลแบบถาวร</span>
        <span v-if="storage.persisted === true" class="income">เปิดอยู่</span>
        <span v-else-if="storage.persisted === false" class="muted">ยังไม่เปิด</span>
        <span v-else class="muted">ไม่รองรับ</span>
      </div>
      <div v-if="usageText" class="row">
        <span>พื้นที่ที่ใช้</span>
        <span>{{ usageText }}</span>
      </div>
      <button
        v-if="storage.persisted === false"
        type="button"
        class="btn btn-block"
        @click="persist"
      >
        <ShieldCheck :size="20" /> ขอให้เบราว์เซอร์เก็บข้อมูลถาวร
      </button>
    </section>

    <h2 class="section-title">เกี่ยวกับ</h2>
    <section class="card stack small">
      <div class="row">
        <span>เวอร์ชัน</span>
        <span>{{ version }} · {{ buildTime }}</span>
      </div>
      <p class="muted">ใช้งานออฟไลน์ได้ ข้อมูลไม่ถูกส่งออกไปนอกเครื่อง</p>
    </section>

    <button type="button" class="btn btn-danger btn-block" @click="reset">
      <Trash2 :size="20" /> ล้างข้อมูลทั้งหมด
    </button>
  </main>
</template>

<style scoped>
.lead {
  color: var(--primary);
}
</style>
