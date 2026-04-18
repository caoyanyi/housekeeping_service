<template>
  <view class="page">
    <view class="hero-card">
      <text class="hero-title">账户设置</text>
      <text class="hero-subtitle">完善常用资料后，预约页会自动带出联系人和地址信息。</text>
    </view>

    <view class="summary-card">
      <view class="summary-main">
        <text class="summary-title">资料完善进度</text>
        <text class="summary-text">{{ profileSummaryText }}</text>
      </view>
      <view class="summary-progress">
        <view class="summary-progress-bar" :style="{ width: `${profileCompletion}%` }"></view>
      </view>
    </view>

    <view class="guide-card">
      <text class="guide-label">当前建议</text>
      <text class="guide-title">{{ settingsGuide.title }}</text>
      <text class="guide-text">{{ settingsGuide.desc }}</text>
      <view class="guide-actions">
        <text class="guide-action primary" @click="handleGuidePrimary">{{ settingsGuide.primaryText }}</text>
        <text class="guide-action" @click="handleGuideSecondary">{{ settingsGuide.secondaryText }}</text>
      </view>
    </view>

    <view class="tips-card">
      <view class="tips-item" v-for="item in profileChecklist" :key="item.label">
        <text class="tips-badge" :class="{ done: item.done }">{{ item.done ? '已完成' : '待完善' }}</text>
        <view class="tips-copy">
          <text class="tips-title">{{ item.label }}</text>
          <text class="tips-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="result-card">
      <text class="section-title">保存后会直接影响这些环节</text>
      <view class="result-list">
        <view v-for="item in profileResults" :key="item.title" class="result-item">
          <text class="result-title">{{ item.title }}</text>
          <text class="result-text">{{ item.text }}</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <text class="section-title">个人资料</text>

      <view class="field">
        <text class="field-label">昵称</text>
        <input
          v-model.trim="profileForm.nickname"
          class="field-input"
          type="text"
          maxlength="20"
          placeholder="请输入昵称"
        />
      </view>

      <view class="field">
        <text class="field-label">手机号</text>
        <view class="field-static">{{ profileForm.phone || '未绑定' }}</view>
      </view>

      <view class="field">
        <text class="field-label">常用地址</text>
        <textarea
          v-model.trim="profileForm.address"
          class="field-textarea"
          maxlength="120"
          placeholder="填写常用服务地址，预约时会自动带出"
        ></textarea>
      </view>

      <button class="primary-button" :loading="profileLoading" :disabled="profileLoading" @click="saveProfile">
        保存资料
      </button>
    </view>

    <view class="section-card">
      <text class="section-title">修改密码</text>
      <text class="section-subtitle">建议使用不低于 6 位的新密码，修改后需要重新登录。</text>

      <view class="field">
        <text class="field-label">当前密码</text>
        <input
          v-model="passwordForm.oldPassword"
          class="field-input"
          type="password"
          maxlength="20"
          placeholder="请输入当前密码"
        />
      </view>

      <view class="field">
        <text class="field-label">新密码</text>
        <input
          v-model="passwordForm.newPassword"
          class="field-input"
          type="password"
          maxlength="20"
          placeholder="请输入6-20位新密码"
        />
      </view>

      <view class="field">
        <text class="field-label">确认新密码</text>
        <input
          v-model="passwordForm.confirmPassword"
          class="field-input"
          type="password"
          maxlength="20"
          placeholder="请再次输入新密码"
        />
      </view>

      <button class="secondary-button" :loading="passwordLoading" :disabled="passwordLoading" @click="submitPassword">
        更新密码
      </button>
    </view>

    <view class="security-card">
      <text class="section-title">账号安全提醒</text>
      <view class="security-list">
        <view v-for="item in securityTips" :key="item.title" class="security-item">
          <text class="security-title">{{ item.title }}</text>
          <text class="security-text">{{ item.text }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';

export default {
    name: 'user-settings',
    data() {
        return {
            token: '',
            profileLoading: false,
            passwordLoading: false,
            profileForm: {
                nickname: '',
                phone: '',
                address: ''
            },
            passwordForm: {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
        };
    },
    computed: {
        profileChecklist() {
            return [
                {
                    label: '昵称',
                    done: Boolean(this.profileForm.nickname),
                    text: this.profileForm.nickname || '建议填写一个便于客服称呼的昵称。'
                },
                {
                    label: '手机号',
                    done: Boolean(this.profileForm.phone),
                    text: this.profileForm.phone || '登录手机号会作为默认联系号码。'
                },
                {
                    label: '常用地址',
                    done: Boolean(this.profileForm.address),
                    text: this.profileForm.address || '建议补充小区、楼栋和门牌号，预约时会自动带出。'
                }
            ];
        },
        profileCompletion() {
            const completed = this.profileChecklist.filter((item) => item.done).length;
            return Math.round((completed / this.profileChecklist.length) * 100);
        },
        profileSummaryText() {
            const nextItem = this.profileChecklist.find((item) => !item.done);
            return nextItem
                ? `当前完成 ${this.profileCompletion}% ，还可补充：${nextItem.label}`
                : '资料已完善，预约页会自动带出联系人和地址';
        },
        settingsGuide() {
            const nextItem = this.profileChecklist.find((item) => !item.done);

            if (nextItem) {
                return {
                    title: `建议优先补上${nextItem.label}`,
                    desc: '资料越完整，后续预约页越像“确认信息”而不是“重新填表”，尤其对首次下单更友好。',
                    primaryText: '先完善资料',
                    secondaryText: '查看预约中心',
                    primaryAction: 'profile',
                    secondaryAction: 'appointments'
                };
            }

            return {
                title: '资料已经比较齐全，现在更值得检查账号安全',
                desc: '如果是常用账号，建议顺手确认密码强度，避免后续更换设备时影响登录和查看预约。',
                primaryText: '检查密码',
                secondaryText: '查看预约中心',
                primaryAction: 'password',
                secondaryAction: 'appointments'
            };
        },
        profileResults() {
            return [
                {
                    title: '预约创建页会自动带出资料',
                    text: '联系人昵称、手机号和常用地址保存后，后续预约只需要再确认而不是重新输入。'
                },
                {
                    title: '平台确认效率会更高',
                    text: '地址和联系人信息更完整时，平台更容易快速核对需求并推进安排。'
                },
                {
                    title: '异常订单也更容易恢复',
                    text: '当订单取消、拒绝或未履约后，完整资料能帮助你更快重新发起预约。'
                }
            ];
        },
        securityTips() {
            return [
                {
                    title: '密码更新后需要重新登录',
                    text: '这能确保旧登录态失效，避免账号在其他设备上继续使用。'
                },
                {
                    title: '常用手机号不要轻易变更',
                    text: '它会影响平台联系、预约确认以及你后续找回账号的便利性。'
                },
                {
                    title: '资料保存和密码更新建议分开操作',
                    text: '先把常用资料补齐，再处理密码，会更不容易打断当前业务流程。'
                }
            ];
        }
    },
    onShow() {
        this.token = uni.getStorageSync('token');
        if (!this.token) {
            const redirect = ROUTER_CONFIG.pages.user.settings;
            uni.showModal({
                title: '请先登录',
                content: '登录后才能设置个人资料，是否现在去登录？',
                success: ({ confirm }) => {
                    if (confirm) {
                        ROUTER_CONFIG.navigate.replace(ROUTER_CONFIG.pages.login, { redirect });
                    } else {
                        ROUTER_CONFIG.navigate.back();
                    }
                }
            });
            return;
        }

        this.getUserInfo();
    },
    methods: {
        goAppointmentList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
        },
        handleGuidePrimary() {
            if (this.settingsGuide.primaryAction === 'profile') {
                uni.pageScrollTo({
                    scrollTop: 260,
                    duration: 250
                });
                return;
            }

            if (this.settingsGuide.primaryAction === 'password') {
                uni.pageScrollTo({
                    scrollTop: 980,
                    duration: 250
                });
            }
        },
        handleGuideSecondary() {
            if (this.settingsGuide.secondaryAction === 'appointments') {
                this.goAppointmentList();
            }
        },
        getUserInfo() {
            this.profileLoading = true;

            this.$request
                .get(API_CONFIG.endpoints.user.getUserInfo, {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    }
                })
                .then((res) => {
                    const data = res.data || {};
                    this.profileForm = {
                        nickname: data.nickname || '',
                        phone: data.phone || '',
                        address: data.address || ''
                    };

                    uni.setStorageSync('userInfo', data);
                })
                .finally(() => {
                    this.profileLoading = false;
                });
        },
        saveProfile() {
            if (!this.profileForm.nickname) {
                uni.showToast({
                    title: '请输入昵称',
                    icon: 'none'
                });
                return;
            }

            this.profileLoading = true;

            this.$request
                .put(
                    API_CONFIG.endpoints.user.updateUserInfo,
                    {
                        nickname: this.profileForm.nickname,
                        address: this.profileForm.address
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    }
                )
                .then(() => {
                    const cachedUser = uni.getStorageSync('userInfo') || {};
                    uni.setStorageSync('userInfo', {
                        ...cachedUser,
                        nickname: this.profileForm.nickname,
                        address: this.profileForm.address
                    });

                    uni.showToast({
                        title: '资料已保存',
                        icon: 'success'
                    });
                })
                .finally(() => {
                    this.profileLoading = false;
                });
        },
        submitPassword() {
            if (!this.passwordForm.oldPassword) {
                uni.showToast({
                    title: '请输入当前密码',
                    icon: 'none'
                });
                return;
            }

            if (!this.passwordForm.newPassword || this.passwordForm.newPassword.length < 6) {
                uni.showToast({
                    title: '新密码不能少于6位',
                    icon: 'none'
                });
                return;
            }

            if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
                uni.showToast({
                    title: '两次输入的密码不一致',
                    icon: 'none'
                });
                return;
            }

            this.passwordLoading = true;

            this.$request
                .put(
                    API_CONFIG.endpoints.user.changePassword,
                    {
                        old_password: this.passwordForm.oldPassword,
                        new_password: this.passwordForm.newPassword
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    }
                )
                .then(() => {
                    this.passwordForm = {
                        oldPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    };

                    uni.showModal({
                        title: '密码已更新',
                        content: '为了保证账号安全，请重新登录。',
                        showCancel: false,
                        success: () => {
                            uni.removeStorageSync('token');
                            uni.removeStorageSync('userInfo');
                            ROUTER_CONFIG.navigate.replace(ROUTER_CONFIG.pages.login);
                        }
                    });
                })
                .finally(() => {
                    this.passwordLoading = false;
                });
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 88px;
  background: linear-gradient(180deg, #f4fbf6 0%, #f6f7f9 220px, #f6f7f9 100%);
}

.hero-card,
.summary-card,
.guide-card,
.tips-card,
.result-card,
.section-card,
.security-card {
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.hero-card {
  padding: 18px;
}

.hero-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.hero-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.summary-card,
.guide-card,
.tips-card,
.result-card,
.section-card,
.security-card {
  margin-top: 14px;
}

.summary-card {
  padding: 16px;
}

.summary-title {
  display: block;
  font-size: 12px;
  color: #98a2b3;
}

.summary-text {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.7;
  color: #344054;
}

.summary-progress {
  height: 8px;
  margin-top: 12px;
  border-radius: 999px;
  background: #edf2f7;
  overflow: hidden;
}

.summary-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
}

.guide-card,
.result-card,
.security-card {
  padding: 16px;
}

.guide-label {
  font-size: 11px;
  color: #1aad19;
}

.guide-title {
  display: block;
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.guide-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.guide-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.guide-action {
  padding: 8px 14px;
  border-radius: 999px;
  background: #eef8f1;
  font-size: 12px;
  color: #1f8f44;
}

.guide-action.primary {
  background: #1aad19;
  color: #ffffff;
}

.tips-card {
  padding: 16px;
}

.tips-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f4f7;
}

.tips-item:first-child {
  padding-top: 0;
}

.tips-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.tips-badge {
  min-width: 56px;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f6;
  font-size: 11px;
  text-align: center;
  color: #667085;
}

.tips-badge.done {
  background: #e7f8eb;
  color: #1f8f44;
}

.tips-copy {
  flex: 1;
}

.tips-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.tips-text {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.result-list,
.security-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item,
.security-item {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.result-title,
.security-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.result-text,
.security-text {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.section-card {
  padding: 18px 16px;
}

.section-title {
  display: block;
  margin-bottom: 8px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.section-subtitle {
  display: block;
  margin-bottom: 14px;
  font-size: 12px;
  line-height: 1.6;
  color: #98a2b3;
}

.field {
  margin-bottom: 14px;
}

.field:last-of-type {
  margin-bottom: 18px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #667085;
}

.field-input,
.field-static,
.field-textarea {
  width: 100%;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  color: #111827;
}

.field-input,
.field-static {
  min-height: 46px;
  padding: 0 14px;
  line-height: 46px;
}

.field-static {
  color: #98a2b3;
}

.field-textarea {
  min-height: 96px;
  padding: 12px 14px;
  line-height: 1.7;
}

.primary-button,
.secondary-button {
  width: 100%;
  height: 46px;
  border-radius: 999px;
  font-size: 16px;
}

.primary-button {
  background: #1aad19;
  color: #ffffff;
}

.secondary-button {
  margin-top: 4px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #d0d5dd;
}

.primary-button[disabled],
.secondary-button[disabled] {
  opacity: 0.65;
}
</style>
