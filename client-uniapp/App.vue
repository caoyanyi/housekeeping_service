<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import Vue from 'vue';
// 引入API配置
import API_CONFIG from './config/api.config';
// 引入路由配置
import ROUTER_CONFIG from './config/router.config';

// 创建全局request对象
const request = {
    // 创建http请求实例
    http(options) {
        return new Promise((resolve, reject) => {
            const token = uni.getStorageSync('token');

            // 构建完整URL
            let {url} = options;
            if(url.indexOf('http') !== 0 && API_CONFIG.baseURL) {
                url = API_CONFIG.baseURL + url;
            }

            // 合并headers
            const headers = {
                'content-type': 'application/json',
                Authorization: token ? `Bearer ${token}` : '',
                ...(options.headers || {})
            };

            uni.request({
                url,
                method: options.method || 'GET',
                data: options.data || {},
                header: headers,
                success: (res) => {
                    if(res.statusCode === 200) {
                        if(res.data.code === 200) {
                            resolve(res.data);
                        } else {
                            // 统一错误处理
                            uni.showToast({
                                title: res.data.message || '请求失败',
                                icon: 'none'
                            });
                            reject(new Error(res.data.message || '请求失败'));
                        }
                    } else if(res.statusCode === 401) {
                        // token过期或无效，跳转到登录页
                        uni.removeStorageSync('token');
                        uni.removeStorageSync('userInfo');
                        uni.showToast({
                            title: '请重新登录',
                            icon: 'none'
                        });
                        setTimeout(() => {
                            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
                        }, 1500);
                        reject(new Error('请重新登录'));
                    } else {
                        uni.showToast({
                            title: '网络错误',
                            icon: 'none'
                        });
                        reject(new Error('网络错误'));
                    }
                },
                fail: (err) => {
                    uni.showToast({
                        title: '请求失败',
                        icon: 'none'
                    });
                    reject(err);
                }
            });
        });
    }
};

// 封装常用请求方法
['get', 'post', 'put', 'delete'].forEach((method) => {
    request[method] = (url, data, options = {}) => request.http({
        url,
        method: method.toUpperCase(),
        data,
        ...options
    });
});

// 添加到全局
Vue.prototype.$request = request;

export default {
    onLaunch() {
        console.log('App Launch');

        // 初始化完成，request已挂载到Vue原型上
    },
    onShow() {
        console.log('App Show');
    },
    onHide() {
        console.log('App Hide');
    }
};
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
