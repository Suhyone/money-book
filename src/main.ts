import './styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { listenForInstallPrompt } from './composables/usePwa'
import router from './router'

listenForInstallPrompt()

createApp(App).use(router).mount('#app')
