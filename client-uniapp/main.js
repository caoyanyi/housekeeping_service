import Vue from 'vue'
import App from './App.vue'

// 全局配置
Vue.config.productionTip = false

// 创建Vue实例
const app = new Vue({
  ...App
})

// 挂载应用
app.$mount()

// 导出app实例（用于调试和测试）
export default app