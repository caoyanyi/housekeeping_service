<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
// 引入API请求工具
import request from './utils/request.js';
// 引入API配置
import API_CONFIG from './config/api.config.js';
// 引入路由配置
import ROUTER_CONFIG from './config/router.config.js';

// 在Vue3中使用export default导出组件
// 注意：在uniapp中，生命周期函数不需要在setup中调用，直接在组件选项中定义即可

export default {
  // 全局属性，在Vue3中使用globalProperties挂载全局属性
  globalData: {
    request,
    API_CONFIG,
    ROUTER_CONFIG
  },
  
  onLaunch() {
    console.log('App Launch');
    // 初始化完成，可以在这里进行一些全局初始化操作
  },
  
  onShow() {
    console.log('App Show');
  },
  
  onHide() {
    console.log('App Hide');
  },
  
  // Vue3的组合式API入口
  setup() {
    // 这里可以使用Vue3的组合式API
    // 注意：在uniapp中，部分生命周期函数需要在组件选项中定义，而不是在setup中
    
    return {
      // 如果需要向模板暴露数据或方法，可以在这里返回
    };
  }
};
</script>

<style>
/* 引入全局样式 */
@import './static/style.css';

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  font-size: 14px;
  color: #333;
  background-color: #f5f5f5;
}
</style>
