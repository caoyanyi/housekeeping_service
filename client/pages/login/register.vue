<template>
  <view class="container">
    <view class="hero-card">
      <text class="hero-eyebrow">注册账号</text>
      <text class="hero-title">创建账号后，预约、资料和服务进度都能集中管理</text>
      <text class="hero-subtitle">
        注册成功后会自动登录，你可以继续浏览服务、提交预约需求，并在个人中心里补充常用信息。
      </text>
      <view class="hero-points">
        <view class="hero-point">
          <text class="hero-point-title">预约记录集中查看</text>
          <text class="hero-point-desc">所有服务订单都会在预约中心里统一展示</text>
        </view>
        <view class="hero-point">
          <text class="hero-point-title">账户资料持续可用</text>
          <text class="hero-point-desc">地址、昵称和设置可以在个人中心随时更新</text>
        </view>
      </view>
    </view>

    <view class="form-card">
      <view class="logo">
        <image src="/static/images/logo.svg" mode="aspectFit"></image>
        <text class="title">创建新账号</text>
      </view>

      <view class="form">
        <view class="input-group">
          <text class="input-label">手机号码</text>
          <input type="number" placeholder="请输入手机号码" v-model="phone" maxlength="11" class="input" />
        </view>

        <view class="input-group">
          <text class="input-label">登录密码</text>
          <input type="password" placeholder="请设置密码(6-20位)" v-model="password" class="input" />
        </view>

        <button class="btn-primary" @click="register" :loading="loading">注册并登录</button>

        <view class="options">
          <text class="login-link" @click="goLogin">已有账号？去登录</text>
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
    name: 'user-register',
    data() {
        return {
            phone: '',
            password: '',
            loading: false
        };
    },
    methods: {
        register() {
            if(!isValidPhone(this.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号码',
                    icon: 'none'
                });
                return;
            }

            if(!this.password || this.password.length < 6 || this.password.length > 20) {
                uni.showToast({
                    title: '密码长度应为6-20位',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            this.$request.post(API_CONFIG.endpoints.user.register, {
                phone: this.phone,
                password: this.password
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    uni.setStorageSync('token', res.data.token);
                    uni.setStorageSync('userInfo', {
                        id: res.data.user_id,
                        phone: this.phone
                    });

                    uni.showToast({
                        title: '注册成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.index);
                    }, 600);
                } else {
                    uni.showToast({
                        title: res.message || '注册失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('注册失败', err);
            });
        },
        goLogin() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
        }
    }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 24px 20px 36px;
  background:
    radial-gradient(circle at top right, rgba(56, 161, 105, 0.12), transparent 28%),
    linear-gradient(180deg, #f1fbf4 0%, #f6f7f9 100%);
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
    linear-gradient(135deg, #1f8f44 0%, #2fa25c 54%, #5cbe7b 100%);
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
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: white;
  border-radius: 999px;
  font-size: 16px;
  margin-top: 18px;
  box-shadow: 0 14px 30px rgba(26, 173, 25, 0.18);
}

.options {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.login-link {
  font-size: 13px;
  color: #1aad19;
}
</style>
