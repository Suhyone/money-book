<script setup lang="ts">
import { ArcElement, Chart, Tooltip, type ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'
import { formatBaht } from '@/lib/money'

Chart.register(ArcElement, Tooltip)

/** value เป็นสตางค์ */
const props = defineProps<{ items: { label: string; value: number; color: string }[] }>()
const theme = useChartTheme()

const data = computed(() => ({
  labels: props.items.map((item) => item.label),
  datasets: [
    {
      data: props.items.map((item) => item.value),
      backgroundColor: props.items.map((item) => item.color),
      borderColor: theme.surface,
      borderWidth: 2,
    },
  ],
}))

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${formatBaht(ctx.parsed)}` } },
  },
}
</script>

<template>
  <div class="donut">
    <Doughnut :data="data" :options="options" />
    <div class="center"><slot /></div>
  </div>
</template>

<style scoped>
.donut {
  position: relative;
  height: 220px;
}

.center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  pointer-events: none;
}
</style>
