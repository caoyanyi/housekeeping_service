<template>
  <view class="container">
    <!-- 头部信息 -->
    <template v-if="userInfo">
      <view class="header">
        <image :src="userInfo.avatar || '/static/images/avatar.svg'" mode="aspectFit" class="avatar"></image>
        <view class="user-info">
          <text class="username">{{ userInfo.username || '未设置昵称' }}</text>
          <text class="phone">{{ userInfo.phone }}</text>
        </view>
        <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
      </view>

      <!-- 功能菜单 -->
      <view class="menu">
        <view class="menu-item" @click="goAppointmentList">
          <image src="/static/images/appointment.svg" mode="aspectFit" class="menu-icon"></image>
          <text class="menu-text">我的预约</text>
          <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
        </view>

        <view class="menu-item" @click="goSettings">
          <image src="/static/images/settings.svg" mode="aspectFit" class="menu-icon"></image>
          <text class="menu-text">设置</text>
          <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
        </view>

        <view class="menu-item" @click="goAbout">
          <image src="/static/images/about.svg" mode="aspectFit" class="menu-icon"></image>
          <text class="menu-text">关于我们</text>
          <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
        </view>
      </view>

      <!-- 退出登录按钮 -->
      <button class="logout-button" @click="logout">退出登录</button>
    </template>
    <!-- 未登录状态 -->
    <view class="not-login" v-else>
      <image src="/static/images/avatar.svg" mode="aspectFit" class="not-login-avatar"></image>
      <text class="not-login-text">请先登录</text>
      <button class="login-button" @click="goLogin">去登录</button>
    </view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config';

export default {
    data() {
        return {
            userInfo: null,
            token: ''
        };
    },
    onShow() {
        // 每次显示页面时获取用户信息
        this.token = uni.getStorageSync('token');
        if(this.token) {
            this.getUserInfo();
        } else {
            this.userInfo = null;
        }
    },
    methods: {
        getUserInfo() {
            this.$request.get(API_CONFIG.endpoints.user.getUserInfo, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                if(res.code === 200) {
                    this.userInfo = res.data;
                } else {
                    // token可能已过期，清除token
                    uni.removeStorageSync('token');
                    this.userInfo = null;
                }
            }).catch((err) => {
                console.error('获取用户信息失败', err);
                // 网络错误时也清除token
                uni.removeStorageSync('token');
                this.userInfo = null;
            });
        },

        goAppointmentList() {
            if(!this.token) {
                this.showLoginTip();
                return;
            }

            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointmentList);
        },

        goSettings() {
            if(!this.token) {
                this.showLoginTip();
                return;
            }

            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.settings);
        },

        goAbout() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.about);
        },

        goLogin() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
        },

        logout() {
            uni.showModal({
                title: '提示',
                content: '确定要退出登录吗？',
                success: (res) => {
                    if(res.confirm) {
                        // 清除token和用户信息
                        uni.removeStorageSync('token');
                        this.userInfo = null;
                        this.token = '';

                        uni.showToast({
                            title: '退出成功',
                            icon: 'success'
                        });
                    }
                }
            });
        },

        showLoginTip() {
            uni.showModal({
                title: '提示',
                content: '请先登录',
                success: (res) => {
                    if(res.confirm) {
                        ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
                    }
                }
            });
        }
    }
};
</script>

<style scoped>
.container {
  padding-bottom: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 头部信息 */
.header {
  background-color: white;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.phone {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.arrow-icon {
  width: 16px;
  height: 16px;
  color: var(--text-color-disabled);
}

/* 功能菜单 */
.menu {
  background-color: white;
  margin-bottom: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eeeeee;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 24px;
  height: 24px;
  margin-right: 16px;
}

.menu-text {
  flex: 1;
  font-size: 16px;
  color: var(--text-color);
}

/* 退出登录按钮 */
.logout-button {
  width: 90%;
  height: 44px;
  margin: 20px auto;
  background-color: #f5f5f5;
  color: var(--error-color);
  border-radius: 22px;
  font-size: 16px;
}

/* 未登录状态 */
.not-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
}

.not-login-avatar {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.not-login-text {
  font-size: 16px;
  color: var(--text-color-disabled);
  margin-bottom: 20px;
}

.login-button {
  width: 120px;
  height: 44px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 22px;
  font-size: 16px;
}
</style>