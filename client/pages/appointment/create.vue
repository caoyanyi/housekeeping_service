<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.png" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">预约服务</text>
      <view class="nav-right"></view>
    </view>

    <!-- 服务信息 -->
    <view class="service-info" v-if="serviceInfo">
      <image :src="serviceInfo.image" mode="aspectFill" class="service-image"></image>
      <view class="service-details">
        <text class="service-name">{{ serviceInfo.name }}</text>
        <text class="service-price">¥{{ serviceInfo.price.toFixed(2) }}</text>
        <text class="service-description">{{ serviceInfo.description }}</text>
      </view>
    </view>

    <!-- 预约表单 -->
    <view class="form-section">
      <text class="section-title">预约信息</text>
      
      <!-- 选择日期 -->
      <view class="form-item">
        <text class="form-label">预约日期</text>
        <input type="text" :value="selectedDate" placeholder="请选择日期" @click="showDatePicker" readonly class="form-input" />
      </view>

      <!-- 选择时间 -->
      <view class="form-item">
        <text class="form-label">预约时间</text>
        <input type="text" :value="selectedTime" placeholder="请选择时间" @click="showTimePicker" readonly class="form-input" />
      </view>

      <!-- 选择技师 -->
      <view class="form-item">
        <text class="form-label">选择技师</text>
        <picker @change="onTechnicianChange" :range="technicians" :range-key="'name'" mode="selector">
          <view class="picker-view">
            <text class="picker-text">{{ selectedTechnician ? selectedTechnician.name : '请选择技师' }}</text>
            <image src="/static/images/arrow_right.png" mode="aspectFit" class="picker-icon"></image>
          </view>
        </picker>
      </view>

      <!-- 联系方式 -->
      <view class="form-item">
        <text class="form-label">联系电话</text>
        <input type="number" v-model="phone" placeholder="请输入联系电话" class="form-input" />
      </view>

      <!-- 备注 -->
      <view class="form-item">
        <text class="form-label">备注信息</text>
        <textarea v-model="remark" placeholder="请输入备注信息（选填）" class="form-textarea" maxlength="200"></textarea>
      </view>
    </view>

    <!-- 提交按钮 -->
    <button class="submit-button" :disabled="!canSubmit" @click="submitAppointment">确认预约</button>

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
    name: 'appointment-create',
    data() {
        return {
            serviceId: '',
            serviceInfo: null,
            technicians: [],
            selectedTechnician: null,
            selectedDate: '',
            selectedTime: '',
            phone: '',
            remark: '',
            token: '',
            loading: false
        };
    },
    onLoad(options) {
        if(options.serviceId) {
            this.serviceId = options.serviceId;
            this.token = uni.getStorageSync('token');
            this.getServiceInfo();
            this.getTechnicians();
            // 获取当前登录用户的电话
            this.getUserInfo();
        }
    },
    computed: {
        canSubmit() {
            return this.selectedDate && this.selectedTime && this.selectedTechnician && this.phone;
        }
    },
    methods: {
        getServiceInfo() {
            this.loading = true;

            this.$request.get(`${API_CONFIG.endpoints.service.detail}/${this.serviceId}`, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    this.serviceInfo = res.data;
                } else {
                    uni.showToast({
                        title: res.msg || '获取服务信息失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取服务信息失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        },

        getTechnicians() {
            this.$request.get(API_CONFIG.endpoints.technician.list, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                if(res.code === 200) {
                    this.technicians = res.data || [];
                } else {
                    uni.showToast({
                        title: res.msg || '获取技师列表失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                console.error('获取技师列表失败', err);
            });
        },

        getUserInfo() {
            this.$request.get(API_CONFIG.endpoints.user.getUserInfo, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                if(res.code === 200) {
                    this.phone = res.data.phone || '';
                }
            }).catch((err) => {
                console.error('获取用户信息失败', err);
            });
        },

        showDatePicker() {
            const currentDate = new Date();
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            uni.datePicker({
                start: `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`,
                end: `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`,
                success: (res) => {
                    this.selectedDate = res.value;
                    // 清除已选时间，因为新的日期可能有不同的可用时间
                    this.selectedTime = '';
                }
            });
        },

        showTimePicker() {
            if(!this.selectedDate) {
                uni.showToast({
                    title: '请先选择日期',
                    icon: 'none'
                });
                return;
            }

            // 模拟可用时间段
            const availableTimes = [
                '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
                '16:00', '16:30', '17:00', '17:30', '18:00'
            ];

            uni.showActionSheet({
                itemList: availableTimes,
                success: (res) => {
                    this.selectedTime = availableTimes[res.tapIndex];
                }
            });
        },

        onTechnicianChange(e) {
            const index = e.detail.value;
            this.selectedTechnician = this.technicians[index];
        },

        submitAppointment() {
            // 验证表单
            if(!/^1[3-9]\d{9}$/.test(this.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号码',
                    icon: 'none'
                });
                return;
            }

            this.loading = true;

            const appointmentData = {
                service_id: this.serviceId,
                technician_id: this.selectedTechnician.id,
                appointment_date: this.selectedDate,
                appointment_time: this.selectedTime,
                phone: this.phone,
                remark: this.remark
            };

            this.$request.post(API_CONFIG.endpoints.appointment.create, appointmentData, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    uni.showToast({
                        title: '预约成功',
                        icon: 'success'
                    });

                    // 预约成功后，跳转到预约详情页或预约列表页
                    setTimeout(() => {
                        ROUTER_CONFIG.navigate.replace({
                            url: `${ROUTER_CONFIG.pages.appointmentList}?appointmentId=${res.data.id}`
                        });
                    }, 1500);
                } else {
                    uni.showToast({
                        title: res.msg || '预约失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('提交预约失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        },

        goBack() {
            ROUTER_CONFIG.navigate.back();
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

/* 服务信息 */
.service-info {
  margin-top: 44px;
  background-color: white;
  padding: 16px;
}

.service-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.service-details {
  padding-left: 8px;
}

.service-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.service-price {
  font-size: 16px;
  color: var(--danger-color);
  display: block;
  margin-bottom: 8px;
}

.service-description {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

/* 表单区域 */
.form-section {
  margin-top: 10px;
  background-color: white;
  padding: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 20px;
  display: block;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 16px;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 44px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 0 16px;
}

.picker-text {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.picker-icon {
  width: 16px;
  height: 16px;
}

.form-textarea {
  width: 100%;
  height: 100px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
}

/* 提交按钮 */
.submit-button {
  width: calc(100% - 32px);
  height: 48px;
  background-color: var(--primary-color);
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-radius: 24px;
  margin: 20px 16px 0;
  padding: 0;
}

.submit-button:disabled {
  background-color: var(--primary-color-disabled);
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>