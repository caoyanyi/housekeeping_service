<template>
  <view class="page">
    <view class="hero-shell">
      <swiper
        v-if="serviceInfo && service.image_urls.length"
        class="hero-swiper"
        indicator-dots
        circular
        autoplay
        interval="3200"
      >
        <swiper-item v-for="image in service.image_urls" :key="image">
          <image :src="image" mode="aspectFill" class="hero-image"></image>
        </swiper-item>
      </swiper>

      <view v-if="serviceInfo" class="hero-summary">
        <view class="hero-topline">
          <text class="service-badge">平台严选</text>
          <text class="service-badge light">{{ service.category_name || '品质服务' }}</text>
        </view>
        <text class="hero-title">{{ service.title }}</text>
        <text class="hero-desc">{{ service.plain_description || '专业服务，省心到家' }}</text>
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
            <text class="hero-metric-value">可预约</text>
            <text class="hero-metric-label">服务状态</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="state-block">
      <text class="state-text">服务详情加载中...</text>
    </view>

    <view v-else-if="serviceInfo" class="content">
      <view class="decision-card">
        <view class="decision-header">
          <view>
            <text class="decision-title">这项服务适合什么场景</text>
            <text class="decision-subtitle">帮用户在下单前快速判断是否匹配当前需求</text>
          </view>
          <text class="decision-price">¥{{ formatCurrency(service.price) }}</text>
        </view>
        <view class="tag-row">
          <text v-for="tag in serviceTags" :key="tag" class="tag">{{ tag }}</text>
        </view>
        <view class="decision-grid">
          <view v-for="item in decisionFacts" :key="item.label" class="decision-item">
            <text class="decision-item-label">{{ item.label }}</text>
            <text class="decision-item-value">{{ item.value }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">服务介绍</text>
        <rich-text
          v-if="hasRichText(service.description)"
          class="rich-content"
          :nodes="service.description"
        ></rich-text>
        <text v-else class="section-text">{{ service.description || '暂无服务介绍' }}</text>
      </view>

      <view class="section-card">
        <text class="section-title">预约后你会经历什么</text>
        <view class="journey-list">
          <view v-for="(step, index) in serviceJourney" :key="step.title" class="journey-item">
            <view class="journey-index">{{ index + 1 }}</view>
            <view class="journey-content">
              <text class="journey-title">{{ step.title }}</text>
              <text class="journey-desc">{{ step.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="service.process.length" class="section-card">
        <text class="section-title">服务流程</text>
        <view class="process-list">
          <view v-for="(step, index) in service.process" :key="`${service.id}-${index}`" class="process-item">
            <view class="process-index">{{ index + 1 }}</view>
            <text class="process-text">{{ step }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">服务保障</text>
        <view class="assurance-list">
          <view v-for="item in assuranceList" :key="item.title" class="assurance-item">
            <text class="assurance-title">{{ item.title }}</text>
            <text class="assurance-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section-card emphasis">
        <text class="section-title">下单说明</text>
        <view class="notice-list">
          <text class="notice-item">预约提交后，平台会联系您确认具体上门时间。</text>
          <text class="notice-item">服务价格以页面展示为准，特殊需求可在备注中补充说明。</text>
          <text class="notice-item">如需取消或调整时间，可在“我的预约”中查看并跟进处理。</text>
        </view>
      </view>
    </view>

    <view v-else class="state-block">
      <image src="/static/images/empty.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-text">没有找到对应服务</text>
    </view>

    <view v-if="serviceInfo" class="bottom-bar">
      <view class="bottom-copy">
        <text class="bottom-price">¥{{ formatCurrency(service.price) }}</text>
        <text class="bottom-tip">提交后平台将尽快联系您确认上门细节</text>
      </view>
      <button class="appointment-button" @click="makeAppointment">立即预约</button>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    hasRichText,
    normalizeService
} from '../../utils/view-models';

export default {
    data() {
        return {
            serviceId: '',
            serviceInfo: null,
            loading: false,
            assuranceList: [
                {
                    title: '平台复核预约信息',
                    desc: '下单后会再次确认服务时间、地址和备注，减少误单和沟通成本。'
                },
                {
                    title: '过程状态清晰可查',
                    desc: '从待接单到已完成，关键状态会同步到“我的预约”。'
                },
                {
                    title: '适合补充个性化需求',
                    desc: '若有特殊清洁区域或时间要求，可在预约备注里提前说明。'
                }
            ],
            serviceJourney: [
                {
                    title: '提交需求',
                    desc: '选择服务并填写联系人、地址、预约时间和备注信息。'
                },
                {
                    title: '平台确认',
                    desc: '客服会主动联系您核对需求，必要时补充服务细节。'
                },
                {
                    title: '上门服务',
                    desc: '确认完成后按预约时间安排服务，结果可在订单中查看。'
                }
            ]
        };
    },
    computed: {
        service() {
            return this.serviceInfo ? normalizeService(this.serviceInfo) : normalizeService();
        },
        serviceTags() {
            return this.service.tags.slice(0, 5);
        },
        decisionFacts() {
            return [
                {
                    label: '服务分类',
                    value: this.service.category_name || '精选服务'
                },
                {
                    label: '预计时长',
                    value: `${this.service.duration || 60}分钟起`
                },
                {
                    label: '预约方式',
                    value: '线上提交需求'
                },
                {
                    label: '确认形式',
                    value: '平台人工复核'
                }
            ];
        }
    },
    onLoad(options) {
        this.serviceId = options?.serviceId || options?.id || '';
        if (!this.serviceId) {
            uni.showToast({
                title: '服务信息不存在',
                icon: 'none'
            });
            return;
        }

        this.getServiceDetail();
    },
    methods: {
        formatCurrency,
        hasRichText,
        getServiceDetail() {
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
        makeAppointment() {
            const token = uni.getStorageSync('token');
            if (!token) {
                const redirect = ROUTER_CONFIG.navigate.buildUrl(
                    ROUTER_CONFIG.pages.service.detail,
                    { serviceId: this.serviceId }
                );

                uni.showModal({
                    title: '请先登录',
                    content: '登录后才能提交预约需求，是否现在去登录？',
                    success: ({ confirm }) => {
                        if (confirm) {
                            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login, { redirect });
                        }
                    }
                });
                return;
            }

            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointment.create, {
                serviceId: this.serviceId
            });
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 96px;
  background:
    linear-gradient(180deg, #edf6f1 0%, #f4f6f8 260px, #f6f7f9 100%);
}

.hero-shell {
  position: relative;
}

.hero-swiper {
  height: 316px;
}

.hero-image {
  width: 100%;
  height: 100%;
}

.hero-summary {
  position: relative;
  margin: -84px 16px 0;
  padding: 18px 18px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(10px);
}

.hero-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-badge {
  padding: 6px 12px;
  border-radius: 999px;
  background: #1f8f44;
  font-size: 11px;
  color: #ffffff;
}

.service-badge.light {
  background: #eef5f0;
  color: #2d6a4f;
}

.hero-title {
  display: block;
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 700;
  color: #111827;
}

.hero-desc {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #586273;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.hero-metric {
  padding: 12px 10px;
  border-radius: 18px;
  background: #f7faf8;
  text-align: center;
}

.hero-metric-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.hero-metric-label {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #6b7280;
}

.content {
  padding: 14px 16px 0;
}

.decision-card,
.section-card {
  margin-bottom: 14px;
  padding: 18px 16px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.decision-card {
  background:
    radial-gradient(circle at top right, rgba(47, 143, 98, 0.12), transparent 32%),
    #ffffff;
}

.decision-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.decision-title {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.decision-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.decision-price {
  flex-shrink: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1aad19;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f2f4f7;
  font-size: 12px;
  color: #475467;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.decision-item {
  padding: 12px;
  border-radius: 18px;
  background: #f8faf8;
}

.decision-item-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
}

.decision-item-value {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: #111827;
}

.section-title {
  display: block;
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.section-text,
.rich-content {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
}

.journey-list,
.process-list,
.notice-list,
.assurance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.journey-item,
.assurance-item {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  border-radius: 18px;
  background: #f8faf8;
}

.journey-index,
.process-index {
  width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 50%;
  background: #1aad19;
  color: #ffffff;
  font-size: 12px;
  text-align: center;
  flex-shrink: 0;
}

.journey-content {
  margin-left: 10px;
}

.journey-title,
.assurance-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #17212f;
}

.journey-desc,
.assurance-desc {
  display: block;
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.process-item {
  display: flex;
  align-items: flex-start;
}

.process-text {
  margin-left: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
}

.emphasis {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbf8 100%);
}

.notice-item {
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
}

.state-block {
  padding: 80px 24px;
  text-align: center;
}

.state-image {
  width: 136px;
  height: 136px;
}

.state-text {
  display: block;
  margin-top: 12px;
  font-size: 14px;
  color: #9ca3af;
}

.bottom-bar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 14px 18px;
  border-radius: 18px;
  background: rgba(17, 24, 39, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
}

.bottom-copy {
  flex: 1;
  padding-right: 12px;
}

.bottom-price {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}

.bottom-tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
}

.appointment-button {
  min-width: 132px;
  height: 42px;
  margin: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}
</style>
