// 外部依赖
import { createSSRApp } from 'vue'

// 主要组件
import App from './App.vue'

// 工具类
import request from './utils/request.js'

// 配置文件
import API_CONFIG from './config/api.config.js'
import ROUTER_CONFIG from './config/router.config.js'

export function createApp() {
  // 创建Vue3应用实例
  const app = createSSRApp(App)
  
  // 在Vue3中使用globalProperties挂载全局属性
  // 这样在所有组件中都可以通过this.$request、this.$API_CONFIG、this.$ROUTER_CONFIG访问
  app.config.globalProperties.$request = request
  app.config.globalProperties.$API_CONFIG = API_CONFIG
  app.config.globalProperties.$ROUTER_CONFIG = ROUTER_CONFIG
  
  // 将配置挂载到全局对象，以便在非组件环境中使用
  if (typeof window !== 'undefined') {
    window.request = request
    window.API_CONFIG = API_CONFIG
    window.ROUTER_CONFIG = ROUTER_CONFIG
  }
  
  return {
    app
  }
}