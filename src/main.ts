import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/userStore'
import { useUiStore } from './stores/uiStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 在挂载前初始化本地状态：加载用户档案、应用主题偏好
const userStore = useUserStore()
const uiStore = useUiStore()
uiStore.initTheme()

Promise.all([userStore.initUser()]).finally(() => {
  app.mount('#app')
})
