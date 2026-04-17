<template>
  <view class="page">
    <view v-if="serviceInfo" class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">预约确认</text>
        <text class="hero-title">确认时间、地址和联系人后即可提交需求</text>
        <text class="hero-subtitle">
          提交成功后平台会主动联系您确认服务安排，建议填写准确的联系电话和详细地址。
        </text>
      </view>
      <view class="hero-metrics">
        <view class="hero-metric">
          <text class="hero-metric-value">¥{{ formatCurrency(service.price) }}</text>
          <text class="hero-metric-label">参考价格</text>
        </view>
        <view class="hero-metric">
          <text class="hero-metric-value">{{ service.duration || 60 }}分钟</text>
          <text class="hero-metric-label">预计时长</text>
        </view>
        <view class="hero-metric">
          <text class="hero-metric-value">人工确认</text>
          <text class="hero-metric-label">预约方式</text>
        </view>
      </view>
    </view>

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

    <view class="summary-card">
      <view class="summary-item">
        <text class="summary-label">预约日期</text>
        <text class="summary-value">{{ selectedDate ? formatDisplayDate(selectedDate) : '待选择' }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">预约时间</text>
        <text class="summary-value">{{ selectedTime || '待选择' }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">联系人</text>
        <text class="summary-value">{{ contactName || '待填写' }}</text>
      </view>
    </view>

    <view class="profile-card">
      <view class="section-head">
        <text class="section-title">资料准备情况</text>
        <text class="section-subtitle">{{ profileAssistHint }}</text>
      </view>
      <view class="profile-assist-list">
        <view v-for="item in profileAssistItems" :key="item.label" class="profile-assist-item">
          <text class="profile-assist-badge" :class="{ done: item.done }">{{ item.done ? '已补齐' : '建议完善' }}</text>
          <view class="profile-assist-copy">
            <text class="profile-assist-title">{{ item.label }}</text>
            <text class="profile-assist-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="readiness-card">
      <view class="section-head">
        <text class="section-title">提交前检查</text>
        <text class="section-subtitle">{{ submitHintText }}</text>
      </view>
      <view class="readiness-list">
        <view v-for="item in readinessItems" :key="item.label" class="readiness-item">
          <text class="readiness-badge" :class="{ done: item.done }">{{ item.done ? '已就绪' : '待完善' }}</text>
          <view class="readiness-copy">
            <text class="readiness-title">{{ item.label }}</text>
            <text class="readiness-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="form-card">
      <view class="section-head">
        <text class="section-title">预约信息</text>
        <text class="section-subtitle">尽量填写完整，平台确认时会更顺畅</text>
      </view>

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
        <view class="quick-slots">
          <text
            v-for="slot in quickTimeOptions"
            :key="slot.value"
            class="quick-slot"
            :class="{ active: selectedTime === slot.value }"
            @click="selectQuickTime(slot.value)"
          >
            {{ slot.label }}
          </text>
        </view>
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
      <view class="section-head">
        <text class="section-title">下单提醒</text>
        <text class="section-subtitle">提交前看一眼，可以减少后续沟通成本</text>
      </view>
      <view class="tips-list">
        <text class="tips-item">预约时间需要晚于当前时间，平台确认后会尽快联系您。</text>
        <text class="tips-item">地址尽量包含小区、楼栋和门牌号，便于安排上门。</text>
        <text class="tips-item">如有特殊需求，可在备注中提前说明，避免重复沟通。</text>
      </view>
    </view>

    <view class="timeline-card">
      <view class="section-head">
        <text class="section-title">提交后会发生什么</text>
        <text class="section-subtitle">让首次预约更有预期，避免提交后不知道下一步</text>
      </view>
      <view class="timeline-list">
        <view v-for="item in postSubmitSteps" :key="item.step" class="timeline-item">
          <text class="timeline-badge">{{ item.step }}</text>
          <view class="timeline-copy">
            <text class="timeline-title">{{ item.title }}</text>
            <text class="timeline-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <button class="submit-button" :disabled="!canSubmit || submitting" :loading="submitting" @click="submitAppointment">
      {{ submitButtonText }}
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
                    this.address &&
                    !this.loading
            );
        },
        readinessItems() {
            return [
                {
                    label: '预约时段',
                    desc:
                        this.selectedDate && this.selectedTime
                            ? `${this.formatDisplayDate(this.selectedDate)} ${this.selectedTime}`
                            : '请选择日期和时间，避免平台二次确认时反复沟通。',
                    done: Boolean(this.selectedDate && this.selectedTime)
                },
                {
                    label: '联系人信息',
                    desc:
                        this.contactName && isValidPhone(this.phone)
                            ? `${this.contactName} · ${this.phone}`
                            : '请填写联系人姓名和有效手机号，方便平台尽快联系。',
                    done: Boolean(this.contactName && isValidPhone(this.phone))
                },
                {
                    label: '服务地址',
                    desc: this.address || '建议补充小区、楼栋和门牌号，便于安排上门。',
                    done: Boolean(this.address)
                }
            ];
        },
        profileAssistItems() {
            return [
                {
                    label: '联系人姓名',
                    desc: this.contactName || '建议填写真实联系人姓名，平台确认时更容易快速核对。',
                    done: Boolean(this.contactName)
                },
                {
                    label: '联系电话',
                    desc: isValidPhone(this.phone) ? this.phone : '建议填写可接听手机号，避免平台多次联系不上。',
                    done: Boolean(isValidPhone(this.phone))
                },
                {
                    label: '服务地址',
                    desc: this.address || '首次预约建议一次写清小区、楼栋和门牌号，减少沟通来回。',
                    done: Boolean(this.address)
                }
            ];
        },
        profileAssistHint() {
            const completedCount = this.profileAssistItems.filter((item) => item.done).length;

            if (completedCount === this.profileAssistItems.length) {
                return '常用资料已经比较完整，本次预约会更顺畅。';
            }

            if (completedCount === 0) {
                return '看起来是首次预约，建议先把常用资料补齐，后续会省下很多重复输入。';
            }

            return `已补齐 ${completedCount}/${this.profileAssistItems.length} 项，再完善一下会更利于平台快速确认。`;
        },
        submitHintText() {
            const nextItem = this.readinessItems.find((item) => !item.done);
            return nextItem ? `还需完善：${nextItem.label}` : '信息已经齐全，提交后平台会尽快联系您确认';
        },
        postSubmitSteps() {
            return [
                {
                    step: '01',
                    title: '平台确认需求',
                    desc: '客服会根据您填写的时间、地址和备注核对服务安排。'
                },
                {
                    step: '02',
                    title: '同步预约状态',
                    desc: '预约中心会展示待确认、已接单或已完成等状态变化。'
                },
                {
                    step: '03',
                    title: '沉淀常用资料',
                    desc: '这次填写的联系人和地址会帮助您下次预约更省步骤。'
                }
            ];
        },
        submitButtonText() {
            if (this.submitting) {
                return '正在提交...';
            }

            return this.canSubmit ? '提交需求，等待确认' : '请先完善预约信息';
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
        },
        quickTimeOptions() {
            return [
                { label: '09:00', value: '09:00' },
                { label: '10:30', value: '10:30' },
                { label: '14:00', value: '14:00' },
                { label: '16:00', value: '16:00' },
                { label: '19:00', value: '19:00' }
            ];
        }
    },
    onLoad(options) {
        this.serviceId = options?.serviceId || options?.id || '';
        this.token = uni.getStorageSync('token');

        if (!this.token) {
            const redirect = ROUTER_CONFIG.navigate.buildUrl(
                ROUTER_CONFIG.pages.appointment.create,
                { serviceId: this.serviceId }
            );
            uni.showModal({
                title: '请先登录',
                content: '登录后才能提交预约需求，是否现在去登录？',
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
                    uni.setStorageSync('userInfo', user);
                })
                .catch(() => {});
        },
        onDateChange(event) {
            this.selectedDate = event.detail.value;
        },
        onTimeChange(event) {
            this.selectedTime = event.detail.value;
        },
        selectQuickTime(time) {
            this.selectedTime = time;
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

            const appointmentTimestamp = new Date(`${this.selectedDate} ${this.selectedTime}`).getTime();
            if (!appointmentTimestamp || appointmentTimestamp <= Date.now()) {
                uni.showToast({
                    title: '请选择晚于当前时间的预约时段',
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
  background:
    radial-gradient(circle at top right, rgba(56, 161, 105, 0.12), transparent 28%),
    #f6f7f9;
}

.hero-card,
.service-card,
.summary-card,
.profile-card,
.readiness-card,
.form-card,
.tips-card,
.timeline-card {
  padding: 16px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.hero-card {
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(135deg, #1f8f44 0%, #2ea95a 56%, #59bf78 100%);
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
  font-size: 23px;
  line-height: 1.35;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.84);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.hero-metric {
  padding: 12px 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  text-align: center;
}

.hero-metric-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
}

.hero-metric-label {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.service-card {
  display: flex;
  margin-top: 14px;
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

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.summary-item {
  padding: 12px 10px;
  border-radius: 18px;
  background: #f8faf8;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: #98a2b3;
}

.summary-value {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.profile-card,
.form-card,
.readiness-card,
.tips-card,
.timeline-card {
  margin-top: 14px;
}

.profile-assist-list,
.readiness-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-assist-item,
.readiness-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: #f8faf8;
}

.profile-assist-badge,
.readiness-badge {
  min-width: 54px;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f6;
  font-size: 11px;
  text-align: center;
  color: #667085;
}

.profile-assist-badge.done,
.readiness-badge.done {
  background: #e7f8eb;
  color: #1f8f44;
}

.profile-assist-copy,
.readiness-copy {
  flex: 1;
}

.profile-assist-title,
.readiness-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.profile-assist-desc,
.readiness-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.section-head {
  margin-bottom: 14px;
}

.section-title {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.section-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #98a2b3;
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
  font-size: 14px;
  color: #344054;
}

.picker-value,
.field-input,
.field-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f7f8fa;
  font-size: 14px;
  color: #111827;
}

.picker-value.placeholder {
  color: #98a2b3;
}

.quick-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.quick-slot {
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef3f0;
  font-size: 12px;
  color: #344054;
}

.quick-slot.active {
  background: #1aad19;
  color: #ffffff;
}

.field-textarea {
  min-height: 88px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tips-item {
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.timeline-badge {
  min-width: 34px;
  height: 22px;
  line-height: 22px;
  border-radius: 999px;
  background: rgba(31, 143, 68, 0.12);
  font-size: 11px;
  text-align: center;
  color: #1f8f44;
}

.timeline-copy {
  flex: 1;
}

.timeline-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.timeline-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.submit-button {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 18px;
  height: 48px;
  line-height: 48px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 16px 34px rgba(26, 173, 25, 0.22);
}

.submit-button[disabled] {
  opacity: 0.65;
}
</style>
