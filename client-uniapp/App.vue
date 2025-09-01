<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
// 引入API配置
import API_CONFIG from './config/api.config.js';
// 引入路由配置
import ROUTER_CONFIG from './config/router.config.js';

export default {
  onLaunch: function() {
    console.log('App Launch')
    // 检查登录状态
    const token = uni.getStorageSync('token')
    if (token) {
      // 设置请求头
      uni.$http.defaults.headers.common['Authorization'] = 'Bearer ' + token
    }
    
    // 初始化http请求配置
    this.initHttp()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  },
  methods: {
    initHttp: function() {
      // 创建http请求实例
      const http = (options) => {
        return new Promise((resolve, reject) => {
          const token = uni.getStorageSync('token')
          
          // 构建完整URL
          let url = options.url;
          if (url.indexOf('http') !== 0 && API_CONFIG.baseURL) {
            url = API_CONFIG.baseURL + url;
          }
          
          uni.request({
            url: url,
            method: options.method || 'GET',
            data: options.data || {},
            header: {
              'content-type': 'application/json',
              'Authorization': token ? 'Bearer ' + token : ''
            },
            success: (res) => {
              if (res.statusCode === 200) {
                if (res.data.code === 200) {
                  resolve(res.data)
                } else {
                  // 统一错误处理
                  uni.showToast({
                    title: res.data.message || '请求失败',
                    icon: 'none'
                  })
                  reject(res.data)
                }
              } else if (res.statusCode === 401) {
                // token过期或无效，跳转到登录页
                uni.removeStorageSync('token')
                uni.removeStorageSync('userInfo')
                uni.showToast({
                  title: '请重新登录',
                  icon: 'none'
                })
                setTimeout(() => {
                  ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login)
                }, 1500)
                reject({ code: 401, message: '请重新登录' })
              } else {
                uni.showToast({
                  title: '网络错误',
                  icon: 'none'
                })
                reject({ code: res.statusCode, message: '网络错误' })
              }
            },
            fail: (err) => {
              uni.showToast({
                title: '请求失败',
                icon: 'none'
              })
              reject(err)
            }
          })
        })
      }
      
      // 添加到全局
      uni.$http = http
      
      // 封装常用请求方法
      ['get', 'post', 'put', 'delete'].forEach(method => {
        uni.$http[method] = (url, data) => {
          return uni.$http({
            url, method: method.toUpperCase(), data
          })
        }
      })
    }
  }
}
</script>

<style>
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

/* 引入全局样式 */
@import './common/style.css';
</style>