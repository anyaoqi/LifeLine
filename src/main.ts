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

// 先恢复 IndexedDB 中的用户档案，再注册 Router。
// 否则首次导航会在 user 仍为空时触发 requiresUser 守卫，刷新受保护页面便会被错误重定向到首页。
const userStore = useUserStore()
const uiStore = useUiStore()
uiStore.initTheme()

async function bootstrap() {
  await userStore.initUser()
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
