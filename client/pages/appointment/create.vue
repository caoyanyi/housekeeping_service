<template>
  <view class="page">
    <view v-if="serviceInfo" class="service-card">
      <image :src="service.image" mode="aspectFill" class="service-image"></image>
      <view class="service-content">
        <text class="service-title">{{ service.title }}</text>
        <text class="service-desc">{{ service.plain_description || '暂无服务介绍' }}</text>
        <view class="service-meta">
          <text class="service-price">¥{{ formatCurrency(service.price) }}</text>
          <text class="service-duration">{{ service.duration || 60 }}分钟起</text>
        </view>
      </view>
    </view>

    <view class="form-card">
      <text class="section-title">预约信息</text>

      <view class="field">
        <text class="field-label">预约日期</text>
        <picker mode="date" :start="minDate" :end="maxDate" @change="onDateChange">
          <view class="picker-value" :class="{ placeholder: !selectedDate }">
            {{ selectedDate ? formatDisplayDate(selectedDate) : '请选择预约日期' }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field-label">预约时间</text>
        <picker mode="time" @change="onTimeChange">
          <view class="picker-value" :class="{ placeholder: !selectedTime }">
            {{ selectedTime || '请选择预约时间' }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field-label">联系人姓名</text>
        <input v-model.trim="contactName" class="field-input" type="text" maxlength="20" placeholder="请输入联系人姓名" />
      </view>

      <view class="field">
        <text class="field-label">联系电话</text>
        <input v-model.trim="phone" class="field-input" type="number" maxlength="11" placeholder="请输入联系电话" />
      </view>

      <view class="field">
        <text class="field-label">服务地址</text>
        <textarea
          v-model.trim="address"
          class="field-textarea"
          maxlength="120"
          placeholder="请输入详细服务地址"
        ></textarea>
      </view>

      <view class="field">
        <text class="field-label">备注信息</text>
        <textarea
          v-model.trim="remark"
          class="field-textarea"
          maxlength="120"
          placeholder="可填写门牌号、期望说明等"
        ></textarea>
      </view>
    </view>

    <view class="tips-card">
      <text class="section-title">下单提醒</text>
      <text class="tips-text">提交后平台将尽快与您确认时间与服务细节，请保持电话畅通。</text>
    </view>

    <button class="submit-button" :disabled="!canSubmit || submitting" :loading="submitting" @click="submitAppointment">
      确认预约
    </button>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    isValidPhone,
    normalizeService
} from '../../utils/view-models';

export default {
    data() {
        return {
            serviceId: '',
            serviceInfo: null,
            selectedDate: '',
            selectedTime: '',
            contactName: '',
            phone: '',
            address: '',
            remark: '',
            token: '',
            loading: false,
            submitting: false
        };
    },
    computed: {
        service() {
            return this.serviceInfo ? normalizeService(this.serviceInfo) : normalizeService();
        },
        canSubmit() {
            return Boolean(
                this.selectedDate &&
                    this.selectedTime &&
                    this.contactName &&
                    this.phone &&
                    this.address
            );
        },
        minDate() {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
                today.getDate()
            ).padStart(2, '0')}`;
        },
        maxDate() {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(
                endDate.getDate()
            ).padStart(2, '0')}`;
        }
    },
    onLoad(options) {
        this.serviceId = options?.serviceId || options?.id || '';
        this.token = uni.getStorageSync('token');

        if (!this.token) {
            uni.showModal({
                title: '请先登录',
                content: '登录后才能提交预约需求，是否现在去登录？',
                success: ({ confirm }) => {
                    if (confirm) {
                        ROUTER_CONFIG.navigate.replace(ROUTER_CONFIG.pages.login);
                    } else {
                        ROUTER_CONFIG.navigate.back();
                    }
                }
            });
            return;
        }

        if (!this.serviceId) {
            uni.showToast({
                title: '服务信息不存在',
                icon: 'none'
            });
            return;
        }

        this.getServiceInfo();
        this.getUserInfo();
    },
    methods: {
        formatCurrency,
        getServiceInfo() {
            this.loading = true;

            this.$request
                .get(`${API_CONFIG.endpoints.service.getServices}/${this.serviceId}`)
                .then((res) => {
                    this.serviceInfo = res.data || null;
                })
                .catch(() => {
                    this.serviceInfo = null;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        getUserInfo() {
            this.$request
                .get(API_CONFIG.endpoints.user.getUserInfo, {}, {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    }
                })
                .then((res) => {
                    const user = res.data || {};
                    this.phone = user.phone || '';
                    this.contactName = user.nickname || '';
                    this.address = user.address || '';
                })
                .catch(() => {});
        },
        onDateChange(event) {
            this.selectedDate = event.detail.value;
        },
        onTimeChange(event) {
            this.selectedTime = event.detail.value;
        },
        formatDisplayDate(dateString) {
            const date = new Date(dateString);
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${month}-${day} ${weekDays[date.getDay()]}`;
        },
        submitAppointment() {
            if (!this.canSubmit) {
                uni.showToast({
                    title: '请先完善预约信息',
                    icon: 'none'
                });
                return;
            }

            if (!isValidPhone(this.phone)) {
                uni.showToast({
                    title: '请输入正确的手机号',
                    icon: 'none'
                });
                return;
            }

            this.submitting = true;

            this.$request
                .post(
                    API_CONFIG.endpoints.appointment.createAppointment,
                    {
                        service_id: this.serviceId,
                        appointment_date: this.selectedDate,
                        appointment_time: this.selectedTime,
                        contact_name: this.contactName,
                        contact_phone: this.phone,
                        address: this.address,
                        notes: this.remark
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    }
                )
                .then(() => {
                    uni.showToast({
                        title: '预约提交成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
                    }, 600);
                })
                .catch(() => {})
                .finally(() => {
                    this.submitting = false;
                });
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 96px;
  background: #f6f7f9;
}

.service-card,
.form-card,
.tips-card {
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.service-card {
  display: flex;
  margin-bottom: 14px;
}

.service-image {
  width: 92px;
  height: 92px;
  border-radius: 16px;
  background: #f2f4f7;
}

.service-content {
  flex: 1;
  margin-left: 12px;
}

.service-title {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.service-desc {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.service-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.service-price {
  font-size: 18px;
  font-weight: 700;
  color: #1aad19;
}

.service-duration {
  font-size: 12px;
  color: #9ca3af;
}

.section-title {
  display: block;
  margin-bottom: 14px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.field {
  padding: 14px 0;
  border-bottom: 1px solid #f1f3f5;
}

.field:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.field-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #667085;
}

.picker-value,
.field-input,
.field-textarea {
  width: 100%;
  font-size: 15px;
  color: #111827;
  background: #f7f8fa;
  border-radius: 14px;
}

.picker-value,
.field-input {
  height: 44px;
  line-height: 44px;
  padding: 0 14px;
}

.field-textarea {
  min-height: 96px;
  padding: 12px 14px;
  line-height: 1.6;
}

.placeholder {
  color: #98a2b3;
}

.tips-card {
  margin-top: 14px;
}

.tips-text {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
}

.submit-button {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 18px;
  height: 46px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1aad19 0%, #38c172 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 16px 30px rgba(26, 173, 25, 0.24);
}

.submit-button[disabled] {
  background: #c9d1d9;
  box-shadow: none;
}
</style>
