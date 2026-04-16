<template>
  <view class="page">
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

    <view v-if="loading" class="state-block">
      <text class="state-text">服务详情加载中...</text>
    </view>

    <view v-else-if="serviceInfo" class="content">
      <view class="summary-card">
        <text class="service-title">{{ service.title }}</text>
        <view class="price-row">
          <text class="service-price">¥{{ formatCurrency(service.price) }}</text>
          <text class="price-tip">按次计费</text>
        </view>
        <view class="meta-row">
          <text class="meta-item">{{ service.category_name || '精选家政服务' }}</text>
          <text class="meta-item">{{ service.duration || 60 }}分钟起</text>
        </view>
        <view class="tag-row">
          <text v-for="tag in service.tags.slice(0, 4)" :key="tag" class="tag">{{ tag }}</text>
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
        <text class="section-title">下单说明</text>
        <view class="notice-list">
          <text class="notice-item">预约提交后，平台会联系您确认具体上门时间。</text>
          <text class="notice-item">服务价格以页面展示为准，特殊需求可在备注中说明。</text>
          <text class="notice-item">如需取消或调整时间，可在“我的预约”中查看处理。</text>
        </view>
      </view>
    </view>

    <view v-else class="state-block">
      <image src="/static/images/empty.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-text">没有找到对应服务</text>
    </view>

    <view v-if="serviceInfo" class="bottom-bar">
      <view>
        <text class="bottom-price">¥{{ formatCurrency(service.price) }}</text>
        <text class="bottom-tip">立即预约即可提交需求</text>
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
            loading: false
        };
    },
    computed: {
        service() {
            return this.serviceInfo ? normalizeService(this.serviceInfo) : normalizeService();
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
                uni.showModal({
                    title: '请先登录',
                    content: '登录后才能提交预约需求，是否现在去登录？',
                    success: ({ confirm }) => {
                        if (confirm) {
                            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
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
  background: #f6f7f9;
}

.hero-swiper {
  height: 280px;
}

.hero-image {
  width: 100%;
  height: 100%;
}

.content {
  margin-top: -26px;
  padding: 0 16px;
}

.summary-card,
.section-card {
  margin-bottom: 14px;
  padding: 18px 16px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.service-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.price-row {
  display: flex;
  align-items: flex-end;
  margin-top: 12px;
}

.service-price {
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
  color: #1aad19;
}

.price-tip {
  margin-left: 8px;
  font-size: 13px;
  color: #9ca3af;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.meta-item,
.tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f2f4f7;
  font-size: 12px;
  color: #475467;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
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

.process-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.process-item {
  display: flex;
  align-items: flex-start;
}

.process-index {
  width: 26px;
  height: 26px;
  line-height: 26px;
  border-radius: 50%;
  background: #1aad19;
  color: #ffffff;
  font-size: 12px;
  text-align: center;
  flex-shrink: 0;
}

.process-text {
  margin-left: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
