<template>
  <view class="page">
    <view v-if="loading" class="state-block">
      <text class="state-text">预约详情加载中...</text>
    </view>

    <view v-else-if="appointmentInfo" class="content">
      <view class="status-card" :class="`status-${appointment.status}`">
        <text class="status-title">{{ appointment.status_text }}</text>
        <text class="status-desc">订单号 #{{ appointment.id }}</text>
      </view>

      <view class="section-card">
        <text class="section-title">预约信息</text>
        <view class="info-row">
          <text class="info-label">预约时间</text>
          <text class="info-value">{{ appointment.appointment_datetime }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">联系人</text>
          <text class="info-value">{{ appointment.contact_name }}</text>
        </view>
        <view class="info-row" @click="makePhoneCall">
          <text class="info-label">联系电话</text>
          <text class="info-value action-text">{{ appointment.contact_phone || '未填写' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">服务地址</text>
          <text class="info-value address-text">{{ appointment.address }}</text>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">服务信息</text>
        <view class="service-row">
          <image :src="appointment.service_image" mode="aspectFill" class="service-image"></image>
          <view class="service-content">
            <text class="service-title">{{ appointment.service_title }}</text>
            <text class="service-price">¥{{ formatCurrency(appointment.service_price) }}</text>
          </view>
        </view>
      </view>

      <view v-if="appointment.notes" class="section-card">
        <text class="section-title">备注信息</text>
        <text class="remark-text">{{ appointment.notes }}</text>
      </view>
    </view>

    <view v-else class="state-block">
      <image src="/static/images/empty.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-text">预约信息不存在或已被删除</text>
    </view>

    <view v-if="showCancelButton" class="bottom-bar">
      <button class="cancel-button" @click="confirmCancel">取消预约</button>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    normalizeAppointment
} from '../../utils/view-models';

export default {
    data() {
        return {
            appointmentId: '',
            appointmentInfo: null,
            token: '',
            loading: false
        };
    },
    computed: {
        appointment() {
            return this.appointmentInfo ? normalizeAppointment(this.appointmentInfo) : normalizeAppointment();
        },
        showCancelButton() {
            return Boolean(this.appointmentInfo) && ['pending', 'accepted'].includes(this.appointment.status);
        }
    },
    onLoad(options) {
        this.appointmentId = options?.appointmentId || options?.id || '';
        this.token = uni.getStorageSync('token');

        if (!this.appointmentId || !this.token) {
            uni.showToast({
                title: '预约信息不存在',
                icon: 'none'
            });
            return;
        }

        this.getAppointmentDetail();
    },
    methods: {
        formatCurrency,
        getAppointmentDetail() {
            this.loading = true;

            this.$request
                .get(`${API_CONFIG.endpoints.appointment.getAppointment}/${this.appointmentId}`, {}, {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    }
                })
                .then((res) => {
                    this.appointmentInfo = res.data || null;
                })
                .catch(() => {
                    this.appointmentInfo = null;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        makePhoneCall() {
            if (!this.appointment.contact_phone) {
                return;
            }

            uni.makePhoneCall({
                phoneNumber: this.appointment.contact_phone
            });
        },
        confirmCancel() {
            uni.showModal({
                title: '取消预约',
                content: '确认取消当前预约吗？取消后需要重新下单。',
                success: ({ confirm }) => {
                    if (confirm) {
                        this.cancelAppointment();
                    }
                }
            });
        },
        cancelAppointment() {
            this.loading = true;

            this.$request
                .delete(`${API_CONFIG.endpoints.appointment.updateAppointmentStatus}/${this.appointmentId}`, {}, {
                    headers: {
                        Authorization: `Bearer ${this.token}`
                    }
                })
                .then(() => {
                    this.appointmentInfo = {
                        ...this.appointmentInfo,
                        status: 'cancelled'
                    };

                    uni.showToast({
                        title: '预约已取消',
                        icon: 'success'
                    });
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
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
  background: #f6f7f9;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-card,
.section-card {
  padding: 18px 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.status-card {
  color: #ffffff;
}

.status-pending {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.status-accepted {
  background: linear-gradient(135deg, #1aad19 0%, #45c27b 100%);
}

.status-completed {
  background: linear-gradient(135deg, #2563eb 0%, #4f7cff 100%);
}

.status-cancelled {
  background: linear-gradient(135deg, #667085 0%, #98a2b3 100%);
}

.status-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
}

.status-desc {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.84);
}

.section-title {
  display: block;
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f4f7;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  width: 72px;
  font-size: 13px;
  color: #667085;
}

.info-value {
  flex: 1;
  text-align: right;
  font-size: 14px;
  line-height: 1.7;
  color: #111827;
}

.action-text {
  color: #1aad19;
}

.address-text {
  text-align: left;
}

.service-row {
  display: flex;
  align-items: center;
}

.service-image {
  width: 84px;
  height: 84px;
  border-radius: 16px;
  background: #eef2f7;
}

.service-content {
  flex: 1;
  margin-left: 12px;
}

.service-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.service-price {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1aad19;
}

.remark-text {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
}

.state-block {
  margin-top: 90px;
  text-align: center;
}

.state-image {
  width: 132px;
  height: 132px;
}

.state-text {
  display: block;
  margin-top: 12px;
  font-size: 14px;
  color: #98a2b3;
}

.bottom-bar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 18px;
}

.cancel-button {
  height: 46px;
  border-radius: 999px;
  background: #ffffff;
  color: #ef4444;
  border: 1px solid #fecaca;
  font-size: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}
</style>
