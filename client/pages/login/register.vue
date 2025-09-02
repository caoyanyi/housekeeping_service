<template>
  <view class="container">
    <view class="logo">
      <image src="/static/images/logo.png" mode="aspectFit"></image>
      <text class="title">注册账号</text>
    </view>

    <view class="form">
      <view class="input-group">
        <input type="number" placeholder="请输入手机号码" v-model="phone" maxlength="11" class="input" />
      </view>

      <view class="input-group">
        <input type="password" placeholder="请设置密码(6-20位)" v-model="password" class="input" />
      </view>

      <button class="btn-primary" @click="register" :loading="loading">注册</button>
    </view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config';

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
            // 验证手机号码
            if(!this.phone || !/^1[3-9]\d{9}$/.test(this.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号码',
                    icon: 'none'
                });
                return;
            }

            // 验证密码
            if(!this.password || this.password.length < 6 || this.password.length > 20) {
                uni.showToast({
                    title: '密码长度应为6-20位',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            // 调用注册接口
            this.$request.post(API_CONFIG.endpoints.user.register, {
                phone: this.phone,
                password: this.password
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    // 注册成功，保存token和用户信息
                    uni.setStorageSync('token', res.data.token);
                    uni.setStorageSync('userInfo', {
                        id: res.data.user_id,
                        phone: this.phone
                    });

                    uni.showToast({
                        title: '注册成功',
                        icon: 'success'
                    });

                    // 跳转到首页
                    setTimeout(() => {
                        ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.home);
                    }, 1500);
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
</style>