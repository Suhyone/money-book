import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TransactionFormView from '@/views/TransactionFormView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** แท็บที่ไฮไลต์ในแถบเมนูล่าง */
    tab?: 'home' | 'summary' | 'budgets' | 'more'
    /** หน้าฟอร์มซ่อนแถบเมนูล่าง */
    hideNav?: boolean
  }
}

// ใช้ hash (#/summary) เพราะ GitHub Pages ไม่มี fallback ไป index.html เปิดลิงก์ตรงจะได้ไม่ 404
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { tab: 'home' } },
    { path: '/add', name: 'add', component: TransactionFormView, meta: { hideNav: true } },
    {
      path: '/tx/:id',
      name: 'edit',
      component: TransactionFormView,
      props: true,
      meta: { hideNav: true },
    },
    {
      path: '/summary',
      name: 'summary',
      // แยกไฟล์เพราะ chart.js ใหญ่ หน้าแรกจะโหลดเร็วขึ้น
      component: () => import('@/views/SummaryView.vue'),
      meta: { tab: 'summary' },
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: () => import('@/views/BudgetsView.vue'),
      meta: { tab: 'budgets' },
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('@/views/MoreView.vue'),
      meta: { tab: 'more' },
    },
    {
      path: '/recurring',
      name: 'recurring',
      component: () => import('@/views/RecurringView.vue'),
      meta: { tab: 'more' },
    },
    {
      path: '/recurring/new',
      name: 'recurring-new',
      component: () => import('@/views/RecurringFormView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/recurring/:id',
      name: 'recurring-edit',
      component: () => import('@/views/RecurringFormView.vue'),
      props: true,
      meta: { hideNav: true },
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue'),
      meta: { tab: 'more' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

export default router
