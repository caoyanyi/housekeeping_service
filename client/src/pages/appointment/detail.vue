<template>
  <view class="page">
    <view v-if="loading" class="state-block">
      <text class="state-text">预约详情加载中...</text>
    </view>

    <view v-else-if="appointmentInfo" class="content">
      <view class="status-card" :class="`status-${appointment.status}`">
        <text class="status-title">{{ appointment.status_text }}</text>
        <text class="status-desc">{{ statusDescription }}</text>
        <text class="status-order">订单号 #{{ appointment.id }}</text>
      </view>

      <view class="priority-card">
        <text class="priority-label">当前建议</text>
        <text class="priority-title">{{ detailRecommendation.title }}</text>
        <text class="priority-desc">{{ detailRecommendation.desc }}</text>
      </view>

      <view class="section-card">
        <text class="section-title">接下来会发生什么</text>
        <view class="journey-list">
          <view v-for="item in statusJourney" :key="item.title" class="journey-item">
            <view class="journey-index" :class="{ done: item.done, active: item.active }">{{ item.step }}</view>
            <view class="journey-copy">
              <text class="journey-title">{{ item.title }}</text>
              <text class="journey-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
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
        <view class="info-row" @click="copyContactPhone">
          <text class="info-label">联系电话</text>
          <text class="info-value action-text">{{ contactPhoneText }}</text>
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

      <view class="section-card">
        <text class="section-title">下一次预约可以更快</text>
        <view class="followup-list">
          <view v-for="item in followupTips" :key="item.title" class="followup-item">
            <text class="followup-title">{{ item.title }}</text>
            <text class="followup-desc">{{ item.desc }}</text>
          </view>
        </view>
        <view class="followup-actions">
          <button class="followup-button ghost" @click="viewSimilarServices">看同类服务</button>
          <button class="followup-button" @click="goAppointmentList">回到预约列表</button>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">如果当前状态不理想，可以这样处理</text>
        <view class="recovery-list">
          <view v-for="item in recoveryOptions" :key="item.title" class="recovery-item">
            <text class="recovery-title">{{ item.title }}</text>
            <text class="recovery-desc">{{ item.desc }}</text>
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

    <view v-if="appointmentInfo" class="bottom-bar" :class="{ stacked: !showCancelButton }">
      <button v-if="showCancelButton" class="bottom-button secondary" @click="confirmCancel">取消预约</button>
      <button class="bottom-button primary" @click="goBookAgain">{{ primaryActionText }}</button>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    normalizeAppointment,
    SERVICE_LIST_FILTERS_KEY
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
        contactPhoneText() {
            return this.appointment.contact_phone
                ? `${this.appointment.contact_phone} · 点击复制`
                : '未填写';
        },
        showCancelButton() {
            return Boolean(this.appointmentInfo) && ['pending', 'accepted'].includes(this.appointment.status);
        },
        hasServiceLink() {
            return Boolean(this.appointment.service_id || this.appointment.service?.id);
        },
        primaryActionText() {
            return this.hasServiceLink ? '再约一次' : '返回预约列表';
        },
        followupTips() {
            return [
                {
                    title: '复用这次的时间偏好',
                    desc: '如果本次预约时间合适，下次可直接选择同类时段，减少确认成本。'
                },
                {
                    title: '保留地址和备注经验',
                    desc: '常见服务地址、重点区域和特殊需求越明确，平台确认越高效。'
                },
                {
                    title: '从同类服务继续比较',
                    desc: '如果本次需求没有完全匹配，可以回到同类服务列表继续挑选更合适的项目。'
                }
            ];
        },
        detailRecommendation() {
            const map = {
                pending: {
                    title: '先保持联系电话畅通，等待平台确认',
                    desc: '待接单通常意味着平台正在核对时间、地址和需求范围，及时接通会更快推进。'
                },
                accepted: {
                    title: '重点确认地址、门牌号和补充备注',
                    desc: '订单已进入准备阶段，这时把现场信息看一遍，能减少服务前临时改动。'
                },
                completed: {
                    title: '这笔订单最适合作为下一次预约的参考',
                    desc: '如果本次服务体验不错，可以直接沿用同类服务再约一次，省去重新比较的时间。'
                },
                cancelled: {
                    title: '如果需求还在，建议重新发起更完整的预约',
                    desc: '取消后订单不会继续推进，重新提交时把时间、地址和重点需求补充完整会更稳妥。'
                },
                rejected: {
                    title: '建议先回看需求信息，再重新提交',
                    desc: '未受理往往意味着时间、地址或需求不匹配，先补充说明再预约成功率更高。'
                },
                no_show: {
                    title: '建议先复盘这次未履约原因，再决定是否重约',
                    desc: '如果仍有服务需求，重新预约时最好在备注中写清现场限制和时间要求。'
                }
            };

            return map[this.appointment.status] || {
                title: '进入详情后可以继续跟进当前预约',
                desc: '平台会根据状态变化持续同步进度，必要时可再预约同类服务。'
            };
        },
        recoveryOptions() {
            return [
                {
                    title: '时间不合适时，重新预约比等待更高效',
                    desc: '取消、拒绝或未履约后，如果需求仍在，建议尽快重新选择更合适的时间段。'
                },
                {
                    title: '把地址和现场信息写得更完整',
                    desc: '小区、楼栋、门牌号和重点区域越明确，平台越容易判断服务安排是否可行。'
                },
                {
                    title: '如果本次服务不完全匹配，先看同类服务再下单',
                    desc: '回到同类服务列表比较承接范围和说明，通常比直接重复提交更稳。'
                }
            ];
        },
        statusDescription() {
            const map = {
                pending: '平台正在确认服务安排，建议保持电话畅通。',
                accepted: '预约已被受理，接下来会进入上门准备阶段。',
                completed: '本次服务已经完成，如有需要可以再次预约。',
                cancelled: '本次预约已取消，如仍有需求可重新提交。',
                rejected: '本次预约暂未受理，建议重新确认时间和需求后再提交。',
                no_show: '本次预约未能按计划完成履约，如仍有需求可重新预约。'
            };

            return map[this.appointment.status] || '平台会根据预约状态持续同步进度。';
        },
        statusJourney() {
            const steps = [
                {
                    step: 1,
                    title: '提交预约',
                    desc: '您已提交服务时间、地址和联系人信息。',
                    done: true,
                    active: false
                },
                {
                    step: 2,
                    title: '平台确认',
                    desc: '平台会联系您核对需求，并安排具体服务执行。',
                    done: ['accepted', 'completed'].includes(this.appointment.status),
                    active: this.appointment.status === 'pending'
                },
                {
                    step: 3,
                    title: '完成服务',
                    desc: '服务完成后，订单状态会更新为已完成或其他最终状态。',
                    done: this.appointment.status === 'completed',
                    active: ['accepted', 'cancelled', 'rejected', 'no_show'].includes(this.appointment.status)
                }
            ];

            if (this.appointment.status === 'cancelled') {
                steps[2].title = '预约已取消';
                steps[2].desc = '当前订单已经结束，如仍需要服务，可以重新预约。';
            }

            if (this.appointment.status === 'rejected') {
                steps[2].title = '预约未受理';
                steps[2].desc = '建议重新确认需求、时间和备注后再次提交预约。';
            }

            if (this.appointment.status === 'no_show') {
                steps[2].title = '本次未履约';
                steps[2].desc = '订单未按计划完成，如仍需要服务，建议重新预约并确认时间。';
            }

            return steps;
        }
    },
    onLoad(options) {
        this.appointmentId = options?.appointmentId || options?.id || '';
        this.token = uni.getStorageSync('token');

        if (!this.token) {
            const redirect = ROUTER_CONFIG.navigate.buildUrl(
                ROUTER_CONFIG.pages.appointment.detail,
                { appointmentId: this.appointmentId }
            );
            uni.showModal({
                title: '请先登录',
                content: '登录后才能查看预约详情，是否现在去登录？',
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

        if (!this.appointmentId) {
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
        copyContactPhone() {
            if (!this.appointment.contact_phone) {
                return;
            }

            uni.setClipboardData({
                data: this.appointment.contact_phone,
                success: () => {
                    uni.showToast({
                        title: '联系电话已复制',
                        icon: 'none'
                    });
                }
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
                    uni.setStorageSync('appointmentListNeedRefresh', true);

                    uni.showToast({
                        title: '预约已取消',
                        icon: 'success'
                    });
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        },
        goBookAgain() {
            if (!this.hasServiceLink) {
                ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
                return;
            }

            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointment.create, {
                serviceId: this.appointment.service_id || this.appointment.service?.id
            });
        },
        viewSimilarServices() {
            uni.setStorageSync(SERVICE_LIST_FILTERS_KEY, {
                categoryId: Number(this.appointment.service?.category_id || 0) || 0,
                keyword: this.appointment.service?.category_name || this.appointment.service_title || '',
                resetSearch: true,
                source: 'appointment-detail'
            });
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goAppointmentList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
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

.status-rejected {
  background: linear-gradient(135deg, #c01048 0%, #e64980 100%);
}

.status-no_show {
  background: linear-gradient(135deg, #b54708 0%, #f38744 100%);
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

.status-order {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.priority-card {
  padding: 18px 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.priority-label {
  font-size: 11px;
  color: #1d79c2;
}

.priority-title {
  display: block;
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.priority-desc {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.section-title {
  display: block;
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.journey-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.journey-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.journey-index {
  width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 50%;
  background: #d0d5dd;
  text-align: center;
  font-size: 12px;
  color: #ffffff;
  flex-shrink: 0;
}

.journey-index.done {
  background: #1aad19;
}

.journey-index.active {
  background: #1d79c2;
}

.journey-copy {
  flex: 1;
}

.journey-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.journey-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
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

.followup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.followup-item {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.followup-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.followup-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.followup-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.followup-button {
  flex: 1;
  height: 42px;
  line-height: 42px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1d79c2 0%, #48a7df 100%);
  color: #ffffff;
  font-size: 14px;
}

.followup-button.ghost {
  background: #ffffff;
  color: #1d79c2;
  border: 1px solid rgba(29, 121, 194, 0.22);
}

.recovery-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recovery-item {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
}

.recovery-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.recovery-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.bottom-bar.stacked {
  grid-template-columns: 1fr;
}

.bottom-button {
  height: 46px;
  border-radius: 999px;
  font-size: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.bottom-button.secondary {
  background: #ffffff;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.bottom-button.primary {
  background: linear-gradient(135deg, #1d79c2 0%, #48a7df 100%);
  color: #ffffff;
}
</style>
