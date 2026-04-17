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
      <view v-if="redirectHint" class="hero-intent">
        <text class="hero-intent-label">登录后将继续</text>
        <text class="hero-intent-title">{{ redirectHint.title }}</text>
        <text class="hero-intent-desc">{{ redirectHint.desc }}</text>
      </view>
    </view>

    <view class="form-card">
      <view class="logo">
        <image src="/static/images/logo.svg" mode="aspectFit"></image>
        <text class="title">欢迎回来</text>
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
          <input type="password" placeholder="请输入密码" v-model="password" class="input" />
        </view>

        <text class="form-tip">{{ formTip }}</text>

        <button class="btn-primary" @click="login" :loading="loading">{{ loginButtonText }}</button>

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
                    desc: '登录成功后会自动回到预约确认页，刚刚选好的服务不会丢失。'
                },
                [ROUTER_CONFIG.pages.appointment.detail]: {
                    title: '查看预约详情',
                    desc: '登录后可继续查看预约状态、平台反馈和后续跟进建议。'
                },
                [ROUTER_CONFIG.pages.service.detail]: {
                    title: '回到服务详情',
                    desc: '登录完成后会回到刚刚查看的服务，方便继续比较或直接预约。'
                },
                [ROUTER_CONFIG.pages.user.settings]: {
                    title: '继续管理账户设置',
                    desc: '登录后即可继续更新账户信息、退出登录或处理安全相关操作。'
                }
            };

            return redirectMap[this.redirectPath] || {
                title: '继续刚才的操作',
                desc: '登录后会自动返回上一条业务流程，不需要重新查找页面。'
            };
        },
        entryCard() {
            if (this.redirectHint) {
                return {
                    title: '当前是带着业务意图登录',
                    subtitle: '平台会尽量帮你衔接回刚刚的页面，不打断当前进度。'
                };
            }

            return {
                title: '登录后信息会自动串起来',
                subtitle: '预约记录、联系人和地址都会沉淀在你的账户里，后续下单更省心。'
            };
        },
        entrySteps() {
            if (this.redirectPath === ROUTER_CONFIG.pages.appointment.create) {
                return [
                    {
                        step: '01',
                        title: '完成登录',
                        desc: '验证账户后立即继续，不需要重新选择服务。'
                    },
                    {
                        step: '02',
                        title: '补齐预约信息',
                        desc: '联系人、时间和地址填好后就可以直接提交需求。'
                    },
                    {
                        step: '03',
                        title: '等待平台确认',
                        desc: '提交后平台会尽快联系您确认上门安排。'
                    }
                ];
            }

            return [
                {
                    step: '01',
                    title: '登录查看进度',
                    desc: '预约状态和服务记录会统一汇总在账户里。'
                },
                {
                    step: '02',
                    title: '保留常用资料',
                    desc: '联系人、地址和昵称可在个人中心持续维护。'
                },
                {
                    step: '03',
                    title: '继续浏览或下单',
                    desc: '回到首页、服务详情或预约中心都更顺手。'
                }
            ];
        },
        formTip() {
            if (this.redirectHint) {
                return '登录成功后会自动回到刚刚的页面，不用担心流程中断。';
            }

            return '手机号码仅用于账户登录和预约沟通，后续下单时会自动带出。';
        },
        loginButtonText() {
            return this.redirectPath === ROUTER_CONFIG.pages.appointment.create ? '登录并继续预约' : '登录';
        }
    },
    onLoad(options) {
        this.redirect = decodeURIComponent(options?.redirect || '');
        const userInfo = uni.getStorageSync('userInfo') || {};
        this.phone = userInfo.phone || '';
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

                    uni.showToast({
                        title: this.redirect ? '登录成功，正在继续' : '登录成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        this.navigateAfterLogin();
                    }, 400);
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
            const params = this.redirect ? { redirect: this.redirect } : {};
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.register, params);
        },

        navigateAfterLogin() {
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
  background: linear-gradient(180deg, #f7fbff 0%, #eef6fd 100%);
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
  background: rgba(29, 121, 194, 0.12);
  font-size: 11px;
  text-align: center;
  color: #1d79c2;
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
  background: linear-gradient(135deg, #1d79c2 0%, #48a7df 100%);
  color: white;
  border-radius: 999px;
  font-size: 16px;
  margin-top: 14px;
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
