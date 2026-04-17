<template>
  <view class="page">
    <template v-if="userInfo">
      <view class="hero-card">
        <image :src="userInfo.avatar || '/static/images/avatar.svg'" mode="aspectFill" class="avatar"></image>
        <view class="hero-content">
          <text class="user-name">{{ displayName }}</text>
          <text class="user-phone">{{ userInfo.phone }}</text>
          <text class="user-tip">预约信息会自动同步常用联系电话和地址，方便后续下单。</text>
        </view>
      </view>

      <view class="metric-grid">
        <view class="metric-card accent" @click="goAppointmentList">
          <text class="metric-value">预约管理</text>
          <text class="metric-label">查看进度和详情</text>
        </view>
        <view class="metric-card" @click="goSettings">
          <text class="metric-value">账户设置</text>
          <text class="metric-label">修改资料和密码</text>
        </view>
      </view>

      <view class="readiness-card">
        <view class="card-header">
          <text class="card-title">下单准备度</text>
          <text class="card-subtitle">{{ readinessHint }}</text>
        </view>
        <view class="readiness-progress">
          <view class="readiness-progress-bar" :style="{ width: `${profileProgress}%` }"></view>
        </view>
        <view class="readiness-list">
          <view v-for="item in profileChecklist" :key="item.label" class="readiness-item">
            <text class="readiness-badge" :class="{ done: item.done }">{{ item.done ? '已完成' : '待补充' }}</text>
            <view class="readiness-copy">
              <text class="readiness-label">{{ item.label }}</text>
              <text class="readiness-text">{{ item.text }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="info-card">
        <view class="card-header">
          <text class="card-title">账户信息</text>
          <text class="card-subtitle">这些信息会影响预约联系效率</text>
        </view>
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
        <view class="card-header">
          <text class="card-title">常用入口</text>
          <text class="card-subtitle">把高频操作收在一处，减少跳转成本</text>
        </view>

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

      <view class="notice-card">
        <text class="notice-title">使用提醒</text>
        <text class="notice-text">如果近期有较多上门服务需求，建议先把常用地址和联系人信息补充完整，这样平台确认预约时会更高效。</text>
        <view class="notice-actions">
          <text class="notice-action primary" @click="goSettings">去完善资料</text>
          <text class="notice-action" @click="goAppointmentList">查看我的预约</text>
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
        },
        profileChecklist() {
            const user = this.userInfo || {};
            return [
                {
                    label: '联系人昵称',
                    done: Boolean(user.nickname),
                    text: user.nickname || '建议填写一个便于平台称呼的昵称。'
                },
                {
                    label: '联系电话',
                    done: Boolean(user.phone),
                    text: user.phone || '登录手机号会作为预约联系号码。'
                },
                {
                    label: '常用地址',
                    done: Boolean(user.address),
                    text: user.address || '建议补充小区、楼栋和门牌号，预约时会自动带出。'
                }
            ];
        },
        profileProgress() {
            const completed = this.profileChecklist.filter((item) => item.done).length;
            return Math.round((completed / this.profileChecklist.length) * 100);
        },
        readinessHint() {
            const nextItem = this.profileChecklist.find((item) => !item.done);
            return nextItem ? `还可补充：${nextItem.label}` : '资料已经齐全，预约时会更省心';
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
  background:
    radial-gradient(circle at top right, rgba(29, 121, 194, 0.1), transparent 28%),
    linear-gradient(180deg, #f1f8fd 0%, #f6f7f9 220px, #f6f7f9 100%);
}

.hero-card,
.readiness-card,
.info-card,
.menu-card,
.notice-card {
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.metric-card {
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

.metric-card.accent {
  background: linear-gradient(135deg, #edf6ff 0%, #dff0ff 100%);
}

.metric-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.metric-label {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #667085;
}

.readiness-card,
.info-card,
.menu-card {
  margin-top: 14px;
  padding: 16px;
}

.readiness-progress {
  height: 8px;
  margin-top: 12px;
  border-radius: 999px;
  background: #edf2f7;
  overflow: hidden;
}

.readiness-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #1d79c2 0%, #49a5dd 100%);
}

.readiness-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.readiness-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.readiness-badge {
  min-width: 56px;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f6;
  font-size: 11px;
  text-align: center;
  color: #667085;
}

.readiness-badge.done {
  background: #e7f8eb;
  color: #1f8f44;
}

.readiness-copy {
  flex: 1;
}

.readiness-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.readiness-text {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.card-header {
  margin-bottom: 8px;
}

.card-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.card-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #98a2b3;
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
  width: 20px;
  height: 20px;
}

.menu-text {
  flex: 1;
  margin-left: 12px;
  font-size: 15px;
  color: #111827;
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

.notice-card {
  margin-top: 14px;
  padding: 16px;
}

.notice-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.notice-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.notice-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.notice-action {
  padding: 8px 14px;
  border-radius: 999px;
  background: #eef4ff;
  font-size: 12px;
  color: #1d79c2;
}

.notice-action.primary {
  background: #1d79c2;
  color: #ffffff;
}

.logout-button,
.login-button {
  margin-top: 20px;
  height: 46px;
  line-height: 46px;
  border-radius: 999px;
  font-size: 15px;
}

.logout-button {
  background: #ffffff;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.16);
}

.login-button {
  background: linear-gradient(135deg, #1d79c2 0%, #48a7df 100%);
  color: #ffffff;
}

.state-block {
  padding: 72px 24px;
  text-align: center;
}

.state-image {
  width: 138px;
  height: 138px;
}

.state-title {
  display: block;
  margin-top: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.state-text {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #98a2b3;
}
</style>
