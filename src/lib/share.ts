export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

/**
 * มือถือ: เปิดหน้าแชร์ของระบบ (ส่งไฟล์เข้า LINE / Google Drive / แอป Files ได้)
 * คอมพิวเตอร์ หรือแชร์ไม่ได้: ดาวน์โหลดไฟล์แทน
 */
export async function shareOrDownload(file: File): Promise<ShareResult> {
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // แชร์ไม่สำเร็จด้วยเหตุผลอื่น → ดาวน์โหลดแทน
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
