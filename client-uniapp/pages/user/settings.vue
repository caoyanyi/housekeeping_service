<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.png" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">设置</text>
      <view class="nav-right"></view>
    </view>

    <!-- 个人信息设置 -->
    <view class="section">
      <text class="section-title">个人信息</text>
      <view class="setting-item" @click="editUsername">
        <text class="setting-label">用户名</text>
        <text class="setting-value">{{ userInfo.username || '未设置' }}</text>
        <image src="/static/images/arrow_right.png" mode="aspectFit" class="arrow-icon"></image>
      </view>
      <view class="setting-item" @click="uploadAvatar">
        <text class="setting-label">头像</text>
        <image :src="userInfo.avatar || '/static/images/avatar.png'" mode="aspectFit" class="avatar-thumbnail"></image>
        <image src="/static/images/arrow_right.png" mode="aspectFit" class="arrow-icon"></image>
      </view>
    </view>

    <!-- 账号与安全 -->
    <view class="section">
      <text class="section-title">账号与安全</text>
      <view class="setting-item" @click="changePassword">
        <text class="setting-label">修改密码</text>
        <image src="/static/images/arrow_right.png" mode="aspectFit" class="arrow-icon"></image>
      </view>
    </view>

    <!-- 修改用户名弹窗 -->
    <view class="dialog" v-if="showEditUsername">
      <view class="dialog-content">
        <text class="dialog-title">修改用户名</text>
        <input type="text" v-model="username" placeholder="请输入新的用户名" class="dialog-input" />
        <view class="dialog-buttons">
          <button class="cancel-button" @click="cancelEditUsername">取消</button>
          <button class="confirm-button" @click="submitUsername">确定</button>
        </view>
      </view>
    </view>

    <!-- 修改密码弹窗 -->
    <view class="dialog" v-if="showChangePassword">
      <view class="dialog-content">
        <text class="dialog-title">修改密码</text>
        <input type="password" v-model="oldPassword" placeholder="请输入当前密码" class="dialog-input" />
        <input type="password" v-model="newPassword" placeholder="请输入新密码" class="dialog-input" />
        <input type="password" v-model="confirmPassword" placeholder="请确认新密码" class="dialog-input" />
        <view class="dialog-buttons">
          <button class="cancel-button" @click="cancelChangePassword">取消</button>
          <button class="confirm-button" @click="submitPassword">确定</button>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config';

export default {
    name: 'user-settings',
    data() {
        return {
            userInfo: {
                username: '',
                avatar: ''
            },
            token: '',
            loading: false,

            // 修改用户名相关
            showEditUsername: false,
            username: '',

            // 修改密码相关
            showChangePassword: false,
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
    },
    onLoad() {
        this.token = uni.getStorageSync('token');
        this.getUserInfo();
    },
    methods: {
        getUserInfo() {
            this.loading = true;

            this.$request.get(API_CONFIG.endpoints.user.getUserInfo, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    this.userInfo = res.data;
                } else {
                    uni.showToast({
                        title: res.msg || '获取用户信息失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取用户信息失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        },

        goBack() {
            ROUTER_CONFIG.navigate.back();
        },

        editUsername() {
            this.username = this.userInfo.username || '';
            this.showEditUsername = true;
        },

        cancelEditUsername() {
            this.showEditUsername = false;
            this.username = '';
        },

        submitUsername() {
            if(!this.username.trim()) {
                uni.showToast({
                    title: '用户名不能为空',
                    icon: 'none'
                });
                return;
            }

            if(this.username.length > 20) {
                uni.showToast({
                    title: '用户名不能超过20个字符',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            this.$request.post(API_CONFIG.endpoints.user.updateUserInfo, {
                username: this.username
            }, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    uni.showToast({
                        title: '修改成功',
                        icon: 'success'
                    });

                    // 更新本地用户信息
                    this.userInfo.username = this.username;
                    this.showEditUsername = false;
                } else {
                    uni.showToast({
                        title: res.msg || '修改失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('修改用户名失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        },

        uploadAvatar() {
            uni.chooseImage({
                count: 1,
                success: (res) => {
                    const tempFilePath = res.tempFilePaths[0];

                    // 模拟上传图片
                    uni.showLoading({
                        title: '上传中...'
                    });

                    // 这里应该有实际的图片上传逻辑
                    // 为了演示，我们使用模拟数据
                    setTimeout(() => {
                        uni.hideLoading();

                        // 假设上传成功，返回一个图片URL
                        const avatarUrl = tempFilePath; // 在实际项目中，这应该是服务器返回的URL

                        // 更新用户头像
                        this.loading = true;

                        this.$request.post(API_CONFIG.endpoints.user.updateUserInfo, {
                            avatar: avatarUrl
                        }, {
                            headers: {
                                Authorization: `Bearer ${this.token}`
                            }
                        }).then((response) => {
                            this.loading = false;

                            if(response.code === 200) {
                                uni.showToast({
                                    title: '头像更新成功',
                                    icon: 'success'
                                });

                                // 更新本地用户信息
                                this.userInfo.avatar = avatarUrl;
                            } else {
                                uni.showToast({
                                    title: response.msg || '头像更新失败',
                                    icon: 'none'
                                });
                            }
                        }).catch((err) => {
                            this.loading = false;
                            console.error('更新头像失败', err);

                            uni.showToast({
                                title: '网络错误，请重试',
                                icon: 'none'
                            });
                        });
                    }, 1000);
                }
            });
        },

        changePassword() {
            this.showChangePassword = true;
        },

        cancelChangePassword() {
            this.showChangePassword = false;
            this.oldPassword = '';
            this.newPassword = '';
            this.confirmPassword = '';
        },

        submitPassword() {
            // 表单验证
            if(!this.oldPassword) {
                uni.showToast({
                    title: '请输入当前密码',
                    icon: 'none'
                });
                return;
            }

            if(!this.newPassword) {
                uni.showToast({
                    title: '请输入新密码',
                    icon: 'none'
                });
                return;
            }

            if(this.newPassword.length < 6) {
                uni.showToast({
                    title: '新密码不能少于6位',
                    icon: 'none'
                });
                return;
            }

            if(this.newPassword !== this.confirmPassword) {
                uni.showToast({
                    title: '两次输入的密码不一致',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            this.$request.post(API_CONFIG.endpoints.user.changePassword, {
                old_password: this.oldPassword,
                new_password: this.newPassword,
                confirm_password: this.confirmPassword
            }, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    uni.showToast({
                        title: '密码修改成功',
                        icon: 'success'
                    });

                    // 关闭弹窗并清空表单
                    this.cancelChangePassword();

                    // 密码修改成功后，建议用户重新登录
                    setTimeout(() => {
                        uni.showModal({
                            title: '提示',
                            content: '密码修改成功，请重新登录',
                            showCancel: false,
                            success: () => {
                                // 清除token并跳转到登录页
                                uni.removeStorageSync('token');
                                ROUTER_CONFIG.navigate.replace(ROUTER_CONFIG.pages.login);
                            }
                        });
                    }, 1500);
                } else {
                    uni.showToast({
                        title: res.msg || '密码修改失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('修改密码失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        }
    }
};
</script>

<style scoped>
.container {
  padding-bottom: 20px;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background-color: white;
  border-bottom: 1px solid #eeeeee;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.nav-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
}

.nav-right {
  width: 20px;
}

/* 内容区域 */
.section {
  margin-top: 44px;
  margin-bottom: 10px;
  background-color: white;
}

.section:nth-child(n+2) {
  margin-top: 10px;
}

.section-title {
  font-size: 14px;
  color: var(--text-color-disabled);
  padding: 12px 16px;
  background-color: #f5f5f5;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eeeeee;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 16px;
  color: var(--text-color);
  margin-right: 16px;
}

.setting-value {
  flex: 1;
  font-size: 16px;
  color: var(--text-color-secondary);
  text-align: right;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  color: var(--text-color-disabled);
}

.avatar-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 16px;
}

/* 弹窗 */
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-content {
  width: 80%;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
}

.dialog-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 20px;
}

.dialog-input {
  width: 100%;
  height: 44px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
  margin-bottom: 16px;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.cancel-button {
  flex: 1;
  height: 44px;
  background-color: #f5f5f5;
  color: var(--text-color);
  margin-right: 8px;
  border-radius: 8px;
  font-size: 16px;
  padding: 0;
}

.confirm-button {
  flex: 1;
  height: 44px;
  background-color: var(--primary-color);
  color: white;
  margin-left: 8px;
  border-radius: 8px;
  font-size: 16px;
  padding: 0;
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
