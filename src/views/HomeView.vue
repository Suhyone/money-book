<script setup lang="ts">
import { computed } from 'vue'
import BackupReminder from '@/components/BackupReminder.vue'
import InstallHint from '@/components/InstallHint.vue'
import MonthSwitcher from '@/components/MonthSwitcher.vue'
import TotalsCard from '@/components/TotalsCard.vue'
import TransactionList from '@/components/TransactionList.vue'
import { useCategoryLookup } from '@/composables/useCategories'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { useSelectedMonth } from '@/composables/useSelectedMonth'
import { listTransactionsInMonth } from '@/db/transactions'
import { totals } from '@/lib/summary'

const { month } = useSelectedMonth()
const transactions = useLiveQuery(() => listTransactionsInMonth(month.value), [month])
const categoryOf = useCategoryLookup()
const monthTotals = computed(() => totals(transactions.value ?? []))
</script>

<template>
  <main class="page">
    <MonthSwitcher />
    <TotalsCard :totals="monthTotals" />
    <InstallHint dismissible />
    <BackupReminder />
    <template v-if="transactions">
      <TransactionList
        v-if="transactions.length > 0"
        :transactions="transactions"
        :category-of="categoryOf"
      />
      <p v-else class="empty">
        ยังไม่มีรายการในเดือนนี้<br />
        แตะปุ่ม <strong>+</strong> ด้านล่างเพื่อเริ่มบันทึก
      </p>
    </template>
  </main>
</template>
