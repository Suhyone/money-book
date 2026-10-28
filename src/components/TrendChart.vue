<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'
import { formatBaht } from '@/lib/money'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

/** income/expense เป็นสตางค์ */
const props = defineProps<{ labels: string[]; income: number[]; expense: number[] }>()
const theme = useChartTheme()
const compact = new Intl.NumberFormat('th-TH', { notation: 'compact' })

const data = computed(() => ({
  labels: props.labels,
  datasets: [
    { label: 'รายรับ', data: props.income, backgroundColor: theme.income, borderRadius: 6 },
    { label: 'รายจ่าย', data: props.expense, backgroundColor: theme.expense, borderRadius: 6 },
  ],
}))

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12 } },
    tooltip: {
      callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatBaht(ctx.parsed.y ?? 0)}` },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { callback: (value) => compact.format(Number(value) / 100) } },
  },
}
</script>

<template>
  <div class="trend">
    <Bar :data="data" :options="options" />
  </div>
</template>

<style scoped>
.trend {
  height: 220px;
}
</style>
