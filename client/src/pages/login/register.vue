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
      <view v-if="redirectHint" class="hero-intent">
        <text class="hero-intent-label">注册后将继续</text>
        <text class="hero-intent-title">{{ redirectHint.title }}</text>
        <text class="hero-intent-desc">{{ redirectHint.desc }}</text>
      </view>
    </view>

    <view class="form-card">
      <view class="logo">
        <image src="/static/images/logo.svg" mode="aspectFit"></image>
        <text class="title">创建新账号</text>
      </view>

      <view class="entry-card">
        <view class="entry-card-head">
          <text class="entry-card-title">{{ entryCard.title }}</text>
          <text class="entry-card-subtitle">{{ entryCard.subtitle }}</text>
        </view>
        <view class="entry-steps">
          <view v-for="item in entrySteps" :key="item.title" class="entry-step">
            <text class="entry-step-badge">{{ item.step }}</text>
            <view class="entry-step-copy">
              <text class="entry-step-title">{{ item.title }}</text>
              <text class="entry-step-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
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

        <text class="form-tip">{{ formTip }}</text>

        <button class="btn-primary" @click="register" :loading="loading">{{ registerButtonText }}</button>

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
            loading: false,
            redirect: ''
        };
    },
    computed: {
        redirectPath() {
            return (this.redirect || '').split('?')[0];
        },
        redirectHint() {
            if (!this.redirectPath) {
                return null;
            }

            const redirectMap = {
                [ROUTER_CONFIG.pages.appointment.create]: {
                    title: '继续提交预约',
                    desc: '注册成功后会直接回到预约流程，首单信息可以继续填写。'
                },
                [ROUTER_CONFIG.pages.service.detail]: {
                    title: '回到刚才查看的服务',
                    desc: '创建账户后会自动回到服务详情页，方便继续比较或直接预约。'
                },
                [ROUTER_CONFIG.pages.appointment.detail]: {
                    title: '查看预约详情',
                    desc: '注册并登录后，可继续查看预约状态和平台反馈。'
                }
            };

            return redirectMap[this.redirectPath] || {
                title: '继续刚才的操作',
                desc: '注册完成后平台会尽量把你带回之前的页面，减少重复操作。'
            };
        },
        entryCard() {
            if (this.redirectHint) {
                return {
                    title: '这是一次带着任务来的注册',
                    subtitle: '创建账号后会自动登录，并尽量衔接回刚刚的业务流程。'
                };
            }

            return {
                title: '先注册，后续流程会顺很多',
                subtitle: '首单预约、资料沉淀和进度查看都会围绕这个账号展开。'
            };
        },
        entrySteps() {
            return [
                {
                    step: '01',
                    title: '创建账号并自动登录',
                    desc: '注册成功后无需再次输入密码，可直接进入下一步。'
                },
                {
                    step: '02',
                    title: '补齐联系人和地址',
                    desc: '首次下单建议把常用信息填完整，后续预约会更快。'
                },
                {
                    step: '03',
                    title: '继续浏览或提交首单',
                    desc: this.redirectHint ? '系统会自动带回刚刚的页面，流程不断档。' : '注册完成后可以继续浏览服务或直接提交预约。'
                }
            ];
        },
        formTip() {
            return this.redirectHint
                ? '注册成功后将自动登录并继续当前流程，不需要重新寻找页面。'
                : '建议使用常用手机号注册，后续预约确认会直接联系这个号码。';
        },
        registerButtonText() {
            return this.redirectPath === ROUTER_CONFIG.pages.appointment.create ? '注册并继续预约' : '注册并登录';
        }
    },
    onLoad(options) {
        this.redirect = decodeURIComponent(options?.redirect || '');
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
                        title: this.redirect ? '注册成功，正在继续' : '注册成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        this.navigateAfterRegister();
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
            const params = this.redirect ? { redirect: this.redirect } : {};
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login, params);
        },
        navigateAfterRegister() {
            if (!this.redirect) {
                ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.index);
                return;
            }

            const tabRoutes = [
                ROUTER_CONFIG.pages.index,
                ROUTER_CONFIG.pages.service.list,
                ROUTER_CONFIG.pages.appointment.list
            ];

            if (tabRoutes.includes(this.redirectPath)) {
                ROUTER_CONFIG.navigate.switchTab(this.redirectPath);
                return;
            }

            ROUTER_CONFIG.navigate.replace(this.redirect);
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

.hero-intent {
  margin-top: 16px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.16);
}

.hero-intent-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.hero-intent-title {
  display: block;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
}

.hero-intent-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.84);
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

.entry-card {
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #f6fcf8 0%, #eef8f1 100%);
}

.entry-card-head {
  margin-bottom: 14px;
}

.entry-card-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.entry-card-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #667085;
}

.entry-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entry-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.entry-step-badge {
  min-width: 34px;
  height: 22px;
  line-height: 22px;
  border-radius: 999px;
  background: rgba(31, 143, 68, 0.12);
  font-size: 11px;
  text-align: center;
  color: #1f8f44;
}

.entry-step-copy {
  flex: 1;
}

.entry-step-title {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.entry-step-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #667085;
}

.form {
  margin-top: 18px;
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

.form-tip {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.6;
  color: #667085;
}

.btn-primary {
  width: 100%;
  height: 48px;
  line-height: 48px;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: white;
  border-radius: 999px;
  font-size: 16px;
  margin-top: 14px;
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
