import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from '@/services/session'
import { scheduleTokenRefresh } from '@/services/token-refresh.service'

import '@/assets/main.css'

const app = createApp(App)

app.use(createPinia())

setUnauthorizedHandler(() => {
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' })
  }
})

scheduleTokenRefresh()

app.use(router)
app.mount('#app')
