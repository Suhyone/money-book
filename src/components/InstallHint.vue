<script setup lang="ts">
import { Share, Smartphone, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { isIOS, isStandalone, useInstallPrompt } from '@/composables/usePwa'

/** dismissible = ปิดได้ (หน้าหลัก) / ไม่ส่ง = แสดงตลอดจนกว่าจะติดตั้ง (หน้าเพิ่มเติม) */
const props = defineProps<{ dismissible?: boolean }>()

const DISMISS_KEY = 'installHintDismissed'
const standalone = isStandalone()
const ios = isIOS()
const { canPrompt, promptInstall } = useInstallPrompt()
const dismissed = ref(props.dismissible === true && readDismissed())

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function dismiss() {
  dismissed.value = true
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // เก็บไม่ได้ก็แค่แสดงอีกครั้งรอบหน้า
  }
}
</script>

<template>
  <div v-if="!standalone && !dismissed" class="banner">
    <Smartphone :size="22" class="banner-icon" />
    <div class="grow">
      <strong>ติดตั้งเป็นแอปก่อนเริ่มบันทึก</strong>
      <p v-if="ios" class="small">
        ใน Safari แตะปุ่มแชร์ <Share :size="14" /> แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”
        จากนั้นเปิดจากไอคอนเท่านั้น — ข้อมูลในแอปที่ติดตั้งแยกจากข้อมูลใน Safari
      </p>
      <p v-else-if="canPrompt" class="small">ติดตั้งแล้วเปิดได้จากหน้าจอโฮม และใช้งานออฟไลน์ได้</p>
      <p v-else class="small">
        เปิดเมนูของเบราว์เซอร์ แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มลงในหน้าจอหลัก”
      </p>
      <div v-if="canPrompt" class="banner-actions">
        <button type="button" class="btn btn-primary" @click="promptInstall">ติดตั้งแอป</button>
      </div>
    </div>
    <button v-if="dismissible" type="button" class="icon-btn" aria-label="ปิด" @click="dismiss">
      <X :size="18" />
    </button>
  </div>
</template>

<style scoped>
.banner .icon-btn {
  width: 32px;
  height: 32px;
  margin: -6px -6px 0 0;
}
</style>
