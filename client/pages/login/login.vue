<template>
  <view class="container">
    <view class="logo">
      <image src="/static/images/logo.png" mode="aspectFit"></image>
      <text class="title">家政服务</text>
    </view>

    <view class="form">
      <view class="input-group">
        <input type="number" placeholder="请输入手机号码" v-model="phone" maxlength="11" class="input" />
      </view>

      <view class="input-group">
        <input type="password" placeholder="请输入密码" v-model="password" class="input" />
      </view>

      <button class="btn-primary" @click="login" :loading="loading">登录</button>

      <view class="options">
        <text class="register" @click="goRegister">注册账号</text>
        <text class="forgot">忘记密码?</text>
      </view>
    </view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config';

export default {
    name: 'user-login',
    data() {
        return {
            phone: '',
            password: '',
            loading: false
        };
    },
    methods: {
        login() {
            // 验证手机号码
            if(!this.phone || !/^1[3-9]\d{9}$/.test(this.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号码',
                    icon: 'none'
                });
                return;
            }

            // 验证密码
            if(!this.password || this.password.length < 6) {
                uni.showToast({
                    title: '密码长度不能少于6位',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            // 调用登录接口
            this.$request.post(API_CONFIG.endpoints.user.login, {
                phone: this.phone,
                password: this.password
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    // 保存token和用户信息
                    uni.setStorageSync('token', res.data.token);
                    uni.setStorageSync('userInfo', res.data);

                    // 跳转到首页
                    ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.home);
                } else {
                    uni.showToast({
                        title: res.message || '登录失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('登录失败', err);
            });
        },

        goRegister() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.register);
        }
    }
};
</script>

<style scoped>
.container {
  padding: 40px 30px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #f5f5f5;
}

.logo {
  text-align: center;
  margin-bottom: 60px;
}

.logo image {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  color: var(--primary-color);
  font-weight: bold;
}

.form {
  margin-bottom: 40px;
}

.input-group {
  margin-bottom: 20px;
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 16px;
  background-color: white;
}

.btn-primary {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 24px;
  font-size: 16px;
  margin-top: 40px;
}

.options {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.register,
.forgot {
  font-size: 14px;
  color: var(--text-color-secondary);
}
</style>