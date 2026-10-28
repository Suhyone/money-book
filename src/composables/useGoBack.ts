import { useRouter } from 'vue-router'

/** ย้อนกลับหน้าก่อน ถ้าเปิดหน้านี้ตรงๆ (ไม่มีประวัติ) ไปที่ fallback แทน */
export function useGoBack() {
  const router = useRouter()
  return (fallback = '/') => {
    if (window.history.state?.back) router.back()
    else void router.replace(fallback)
  }
}
