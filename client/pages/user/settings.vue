<template>
  <view class="page">
    <view class="hero-card">
      <text class="hero-title">账户设置</text>
      <text class="hero-subtitle">完善常用资料后，预约页会自动带出联系人和地址信息。</text>
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

      <button class="primary-button" :loading="profileLoading" @click="saveProfile">
        保存资料
      </button>
    </view>

    <view class="section-card">
      <text class="section-title">修改密码</text>

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

      <button class="secondary-button" :loading="passwordLoading" @click="submitPassword">
        更新密码
      </button>
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
.section-card {
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

.section-card {
  margin-top: 14px;
  padding: 18px 16px;
}

.section-title {
  display: block;
  margin-bottom: 14px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
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
</style>
