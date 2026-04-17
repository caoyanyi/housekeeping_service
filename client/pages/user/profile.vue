<template>
  <view class="page">
    <template v-if="userInfo">
      <view class="hero-card">
        <image :src="userInfo.avatar || '/static/images/avatar.svg'" mode="aspectFill" class="avatar"></image>
        <view class="hero-content">
          <text class="user-name">{{ displayName }}</text>
          <text class="user-phone">{{ userInfo.phone }}</text>
          <text class="user-tip">预约信息会自动同步常用联系电话和地址</text>
        </view>
      </view>

      <view class="info-card">
        <view class="info-item">
          <text class="info-label">常用地址</text>
          <text class="info-value">{{ userInfo.address || '暂未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">账号状态</text>
          <text class="info-value">{{ userInfo.status === 1 ? '正常使用' : '受限' }}</text>
        </view>
      </view>

      <view class="menu-card">
        <view class="menu-item" @click="goAppointmentList">
          <image src="/static/images/appointment.svg" mode="aspectFit" class="menu-icon"></image>
          <text class="menu-text">我的预约</text>
          <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
        </view>

        <view class="menu-item" @click="goSettings">
          <image src="/static/images/settings.svg" mode="aspectFit" class="menu-icon"></image>
          <text class="menu-text">账户设置</text>
          <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
        </view>

        <view class="menu-item" @click="showAbout">
          <image src="/static/images/about.svg" mode="aspectFit" class="menu-icon"></image>
          <text class="menu-text">关于平台</text>
          <image src="/static/images/arrow_right.svg" mode="aspectFit" class="arrow-icon"></image>
        </view>
      </view>

      <button class="logout-button" @click="logout">退出登录</button>
    </template>

    <view v-else class="state-block">
      <image src="/static/images/avatar.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-title">登录后查看个人中心</text>
      <text class="state-text">在这里可以查看预约记录、修改资料和管理账号设置。</text>
      <button class="login-button" @click="goLogin">去登录</button>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';

export default {
    data() {
        return {
            userInfo: null,
            token: ''
        };
    },
    computed: {
        displayName() {
            return this.userInfo?.nickname || `用户 ${this.userInfo?.phone || ''}`;
        }
    },
    onShow() {
        this.token = uni.getStorageSync('token');
        if (!this.token) {
            this.userInfo = null;
            return;
        }

        const cachedUser = uni.getStorageSync('userInfo');
        if (cachedUser) {
            this.userInfo = cachedUser;
        }

        this.getUserInfo();
    },
    methods: {
        getUserInfo() {
            this.$request
                .get(API_CONFIG.endpoints.user.getUserInfo, {}, {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    }
                })
                .then((res) => {
                    this.userInfo = res.data || null;
                    if (this.userInfo) {
                        uni.setStorageSync('userInfo', this.userInfo);
                    }
                })
                .catch(() => {
                    uni.removeStorageSync('token');
                    uni.removeStorageSync('userInfo');
                    this.userInfo = null;
                    this.token = '';
                });
        },
        goAppointmentList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
        },
        goSettings() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.user.settings);
        },
        showAbout() {
            uni.showModal({
                title: '关于平台',
                content: '家政服务平台提供保洁、母婴、搬家、维修等到家服务，支持在线预约和进度查看。',
                showCancel: false
            });
        },
        goLogin() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
        },
        logout() {
            uni.showModal({
                title: '退出登录',
                content: '确定退出当前账号吗？',
                success: ({ confirm }) => {
                    if (!confirm) {
                        return;
                    }

                    uni.removeStorageSync('token');
                    uni.removeStorageSync('userInfo');
                    this.userInfo = null;
                    this.token = '';

                    uni.showToast({
                        title: '已退出登录',
                        icon: 'success'
                    });
                }
            });
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 84px;
  background: linear-gradient(180deg, #f4fbf6 0%, #f6f7f9 220px, #f6f7f9 100%);
}

.hero-card,
.info-card,
.menu-card {
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.hero-card {
  display: flex;
  align-items: center;
  padding: 18px;
}

.avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #eef2f7;
}

.hero-content {
  flex: 1;
  margin-left: 14px;
}

.user-name {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.user-phone {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  color: #475467;
}

.user-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #98a2b3;
}

.info-card,
.menu-card {
  margin-top: 14px;
  padding: 4px 16px;
}

.info-item,
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #f2f4f7;
}

.info-item:last-child,
.menu-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #667085;
}

.info-value {
  max-width: 62%;
  font-size: 14px;
  line-height: 1.6;
  text-align: right;
  color: #111827;
}

.menu-item {
  justify-content: flex-start;
}

.menu-icon {
  width: 24px;
  height: 24px;
}

.menu-text {
  flex: 1;
  margin-left: 14px;
  font-size: 15px;
  color: #111827;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.logout-button,
.login-button {
  width: 100%;
  height: 46px;
  margin-top: 18px;
  border-radius: 999px;
  font-size: 16px;
}

.logout-button {
  background: #ffffff;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.login-button {
  background: #1aad19;
  color: #ffffff;
}

.state-block {
  margin-top: 92px;
  text-align: center;
  padding: 0 28px;
}

.state-image {
  width: 120px;
  height: 120px;
  opacity: 0.92;
}

.state-title {
  display: block;
  margin-top: 14px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.state-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #98a2b3;
}
</style>
