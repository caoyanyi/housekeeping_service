<template>
  <view class="container">
    <view class="hero-card">
      <text class="hero-eyebrow">账号登录</text>
      <text class="hero-title">登录后继续你的预约和服务进度</text>
      <text class="hero-subtitle">
        登录后可以查看预约记录、快速回到服务详情页，并同步使用常用联系人和地址信息。
      </text>
      <view class="hero-points">
        <view class="hero-point">
          <text class="hero-point-title">查看预约进度</text>
          <text class="hero-point-desc">待接单、已接单、已完成都会实时展示</text>
        </view>
        <view class="hero-point">
          <text class="hero-point-title">保存常用资料</text>
          <text class="hero-point-desc">下次预约时可自动带出联系人和地址</text>
        </view>
      </view>
    </view>

    <view class="form-card">
      <view class="logo">
        <image src="/static/images/logo.svg" mode="aspectFit"></image>
        <text class="title">欢迎回来</text>
      </view>

      <view class="form">
        <view class="input-group">
          <text class="input-label">手机号码</text>
          <input type="number" placeholder="请输入手机号码" v-model="phone" maxlength="11" class="input" />
        </view>

        <view class="input-group">
          <text class="input-label">登录密码</text>
          <input type="password" placeholder="请输入密码" v-model="password" class="input" />
        </view>

        <button class="btn-primary" @click="login" :loading="loading">登录</button>

        <view class="options">
          <text class="register" @click="goRegister">没有账号？去注册</text>
          <text class="forgot" @click="showForgotTip">忘记密码</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import { isValidPhone } from '../../utils/view-models';

export default {
    name: 'user-login',
    data() {
        return {
            phone: '',
            password: '',
            loading: false,
            redirect: ''
        };
    },
    onLoad(options) {
        this.redirect = decodeURIComponent(options?.redirect || '');
    },
    methods: {
        login() {
            if(!isValidPhone(this.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号码',
                    icon: 'none'
                });
                return;
            }

            if(!this.password || this.password.length < 6) {
                uni.showToast({
                    title: '密码长度不能少于6位',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            this.$request.post(API_CONFIG.endpoints.user.login, {
                phone: this.phone,
                password: this.password
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    uni.setStorageSync('token', res.data.token);
                    uni.setStorageSync('userInfo', res.data);

                    if (this.redirect) {
                        ROUTER_CONFIG.navigate.replace(this.redirect);
                    } else {
                        ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.index);
                    }
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
        },

        showForgotTip() {
            uni.showModal({
                title: '找回密码',
                content: '当前版本暂未开放自助找回密码，如需帮助请联系平台客服。',
                showCancel: false
            });
        }
    }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 24px 20px 36px;
  background:
    radial-gradient(circle at top left, rgba(29, 121, 194, 0.12), transparent 28%),
    linear-gradient(180deg, #f3f8fd 0%, #f6f7f9 100%);
}

.hero-card,
.form-card {
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.hero-card {
  padding: 22px 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(135deg, #1d5f8b 0%, #2f7cc2 54%, #57a8d6 100%);
  color: #ffffff;
}

.hero-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.82);
}

.hero-title {
  display: block;
  margin-top: 10px;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.84);
}

.hero-points {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.hero-point {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
}

.hero-point-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.hero-point-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

.form-card {
  margin-top: 16px;
  padding: 24px 20px 22px;
}

.logo {
  text-align: left;
  margin-bottom: 24px;
}

.logo image {
  width: 64px;
  height: 64px;
  margin-bottom: 14px;
}

.title {
  font-size: 24px;
  color: #111827;
  font-weight: 700;
}

.input-group {
  margin-bottom: 18px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #475467;
}

.input {
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 15px;
  background-color: #f7f8fa;
  color: #111827;
}

.btn-primary {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: linear-gradient(135deg, #1d79c2 0%, #48a7df 100%);
  color: white;
  border-radius: 999px;
  font-size: 16px;
  margin-top: 18px;
  box-shadow: 0 14px 30px rgba(47, 124, 194, 0.18);
}

.options {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.register,
.forgot {
  font-size: 13px;
  color: #667085;
}

.register {
  color: #1d79c2;
}
</style>
