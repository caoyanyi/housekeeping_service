<template>
  <view class="page">
    <swiper
      class="hero-swiper"
      indicator-dots
      indicator-color="rgba(255,255,255,0.45)"
      indicator-active-color="#ffffff"
      autoplay
      interval="3200"
      circular
    >
      <swiper-item v-for="(item, index) in banners" :key="index">
        <image :src="item.image" mode="aspectFill" class="hero-image"></image>
      </swiper-item>
    </swiper>

    <view class="hero-card">
      <text class="hero-title">安心家政，按需预约</text>
      <text class="hero-subtitle">保洁、母婴、搬家、维修等服务一站式下单</text>
    </view>

    <view class="section-card">
      <view class="section-header">
        <text class="section-title">服务分类</text>
        <text class="section-subtitle">点一下就能快速筛选</text>
      </view>
      <view class="category-grid">
        <view
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          @click="goServiceList(category.id)"
        >
          <image :src="`/static/images/${category.icon}`" mode="aspectFit" class="category-icon"></image>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>

    <view class="job-entry" @click="goJobApply">
      <view>
        <text class="job-title">家政从业者入口</text>
        <text class="job-subtitle">填写求职信息，平台会尽快与您联系</text>
      </view>
      <text class="job-action">去报名</text>
    </view>

    <view class="section-card">
      <view class="section-header">
        <text class="section-title">热门服务</text>
        <text class="section-link" @click="goServiceList(0)">查看全部</text>
      </view>

      <view v-if="hotServices.length" class="service-grid">
        <view
          v-for="service in hotServices"
          :key="service.id"
          class="service-item"
          @click="goServiceDetail(service.id)"
        >
          <image :src="service.image" mode="aspectFill" class="service-image"></image>
          <view class="service-content">
            <text class="service-title">{{ service.title }}</text>
            <text class="service-desc">{{ service.plain_description || '专业服务，省心到家' }}</text>
            <view class="service-meta">
              <text class="service-price">¥{{ formatCurrency(service.price) }}</text>
              <text class="service-duration">{{ service.duration || 60 }}分钟起</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="loadingHot" class="inline-state">
        <text>热门服务加载中...</text>
      </view>

      <view v-else class="inline-state">
        <text>暂时还没有推荐服务</text>
      </view>
    </view>

    <view class="notice-card">
      <image src="/static/images/notice.svg" mode="aspectFit" class="notice-icon"></image>
      <view class="notice-content">
        <text class="notice-title">服务提醒</text>
        <text class="notice-text">{{ noticeText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    normalizeService,
    SERVICE_LIST_FILTERS_KEY
} from '../../utils/view-models';

export default {
    data() {
        return {
            banners: [
                { image: '/static/images/banner1.svg' },
                { image: '/static/images/banner2.svg' },
                { image: '/static/images/banner3.svg' }
            ],
            categories: [],
            hotServices: [],
            loadingHot: false,
            noticeText: '支持预约下单、进度查看和服务信息同步，预约后平台会主动联系您确认上门时间。'
        };
    },
    onLoad() {
        this.getCategories();
        this.getHotServices();
    },
    methods: {
        formatCurrency,
        getCategories() {
            this.$request
                .get(API_CONFIG.endpoints.category.getCategories)
                .then((res) => {
                    this.categories = Array.isArray(res.data) ? res.data : [];
                })
                .catch(() => {
                    uni.showToast({
                        title: '分类加载失败',
                        icon: 'none'
                    });
                });
        },
        getHotServices() {
            this.loadingHot = true;

            this.$request
                .get(API_CONFIG.endpoints.service.getServices, {
                    page: 1,
                    page_size: 4
                })
                .then((res) => {
                    const list = (res.data?.list || []).map((item) => normalizeService(item));
                    this.hotServices = list;
                })
                .catch(() => {
                    this.hotServices = [];
                })
                .finally(() => {
                    this.loadingHot = false;
                });
        },
        goServiceList(categoryId = 0) {
            uni.setStorageSync(SERVICE_LIST_FILTERS_KEY, {
                categoryId,
                resetSearch: true,
                source: 'index'
            });
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goServiceDetail(serviceId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.detail, { serviceId });
        },
        goJobApply() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.job.apply);
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 84px;
  background: linear-gradient(180deg, #f6fbf8 0%, #f4f6f8 240px, #f7f7f7 100%);
}

.hero-swiper {
  height: 188px;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(26, 173, 25, 0.14);
}

.hero-image {
  width: 100%;
  height: 100%;
}

.hero-card {
  margin-top: -28px;
  margin-left: 16px;
  margin-right: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.hero-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.hero-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #667085;
}

.section-card,
.notice-card {
  margin-top: 16px;
  padding: 18px 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 14px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.section-subtitle,
.section-link {
  font-size: 13px;
  color: #6b7280;
}

.section-link {
  color: #1aad19;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
}

.category-item {
  width: 25%;
  padding: 10px 0 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.category-icon {
  width: 54px;
  height: 54px;
  padding: 10px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f4fbf5 0%, #edf8ef 100%);
}

.category-name {
  margin-top: 10px;
  font-size: 12px;
  color: #374151;
  text-align: center;
}

.job-entry {
  margin-top: 16px;
  padding: 18px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1f8f44 0%, #4caf50 100%);
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 12px 28px rgba(34, 139, 74, 0.2);
}

.job-title {
  display: block;
  font-size: 17px;
  font-weight: 700;
}

.job-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
}

.job-action {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.service-item {
  overflow: hidden;
  border-radius: 18px;
  background: #f8faf8;
}

.service-image {
  width: 100%;
  height: 118px;
}

.service-content {
  padding: 12px;
}

.service-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.service-desc {
  display: block;
  min-height: 34px;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: #6b7280;
}

.service-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.service-price {
  font-size: 16px;
  font-weight: 700;
  color: #1aad19;
}

.service-duration {
  font-size: 12px;
  color: #6b7280;
}

.inline-state {
  padding: 30px 0 12px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.notice-card {
  display: flex;
  align-items: flex-start;
}

.notice-icon {
  width: 22px;
  height: 22px;
  margin-right: 10px;
  margin-top: 2px;
}

.notice-content {
  flex: 1;
}

.notice-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.notice-text {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #6b7280;
}
</style>
