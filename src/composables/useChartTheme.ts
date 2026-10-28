import { Chart } from 'chart.js'

/** อ่านสีจาก CSS variables ให้กราฟเข้ากับธีมสว่าง/มืด */
export function useChartTheme() {
  const style = getComputedStyle(document.documentElement)
  const color = (name: string) => style.getPropertyValue(name).trim()
  Chart.defaults.color = color('--muted')
  Chart.defaults.borderColor = color('--border')
  Chart.defaults.font.family = style.fontFamily
  return { income: color('--income'), expense: color('--expense'), surface: color('--surface') }
}
