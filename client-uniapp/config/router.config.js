// 路由配置文件
export default {
  // 页面路由配置
  pages: {
    // 登录相关
    login: '/pages/login/login',
    
    // 首页相关
    index: '/pages/index/index',
    
    // 服务相关
    service: {
      list: '/pages/service/list',
      detail: '/pages/service/detail'
    },
    
    // 预约相关
    appointment: {
      list: '/pages/appointment/list',
      detail: '/pages/appointment/detail',
      create: '/pages/appointment/create'
    },
    
    // 用户相关
    user: {
      profile: '/pages/user/profile',
      settings: '/pages/user/settings'
    }
  },
  
  // 导航方法封装
  navigate: {
    // 保留当前页面，跳转到应用内的某个页面
    to: function(route, params = {}) {
      const url = this.buildUrl(route, params)
      return new Promise((resolve, reject) => {
        uni.navigateTo({
          url: url,
          success: resolve,
          fail: reject
        })
      })
    },
    
    // 关闭当前页面，跳转到应用内的某个页面
    replace: function(route, params = {}) {
      const url = this.buildUrl(route, params)
      return new Promise((resolve, reject) => {
        uni.redirectTo({
          url: url,
          success: resolve,
          fail: reject
        })
      })
    },
    
    // 跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面
    switchTab: function(route) {
      return new Promise((resolve, reject) => {
        uni.switchTab({
          url: route,
          success: resolve,
          fail: reject
        })
      })
    },
    
    // 返回上一页
    back: function(delta = 1) {
      return new Promise((resolve, reject) => {
        uni.navigateBack({
          delta: delta,
          success: resolve,
          fail: reject
        })
      })
    },
    
    // 构建带参数的URL
    buildUrl: function(route, params = {}) {
      let url = route
      if (Object.keys(params).length > 0) {
        const queryString = Object.keys(params)
          .map(key => `${key}=${encodeURIComponent(params[key])}`)
          .join('&')
        url = `${url}?${queryString}`
      }
      return url
    }
  }
};