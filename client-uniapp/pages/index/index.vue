<template>
  <view class="container">
    <!-- 轮播图 -->
    <swiper class="banner" indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" autoplay interval="3000">
      <swiper-item v-for="(item, index) in banners" :key="index">
        <image :src="item.image" mode="aspectFill" class="banner-image"></image>
      </swiper-item>
    </swiper>
    
    <!-- 分类导航 -->
    <view class="category">
      <view class="category-item" v-for="category in categories" :key="category.id" @click="goServiceList(category.id)">
        <image :src="category.icon" mode="aspectFit" class="category-icon"></image>
        <text class="category-name">{{ category.name }}</text>
      </view>
    </view>
    
    <!-- 热门服务 -->
    <view class="hot-services">
      <view class="section-header">
        <text class="section-title">热门服务</text>
        <text class="more" @click="goServiceList()">更多 ></text>
      </view>
      
      <view class="service-list">
        <view class="service-item" v-for="service in hotServices" :key="service.id" @click="goServiceDetail(service.id)">
          <image :src="service.image_urls[0]" mode="aspectFill" class="service-image"></image>
          <text class="service-title">{{ service.title }}</text>
          <text class="service-price">¥{{ service.price }}</text>
        </view>
      </view>
    </view>
    
    <!-- 公告 -->
    <view class="notice">
      <image src="/static/images/notice.png" mode="aspectFit" class="notice-icon"></image>
      <text class="notice-text">{{ noticeText }}</text>
    </view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config.js';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config.js';

export default {
  data() {
    return {
      banners: [
        { image: '/static/images/banner1.jpg' },
        { image: '/static/images/banner2.jpg' },
        { image: '/static/images/banner3.jpg' }
      ],
      categories: [],
      hotServices: [],
      noticeText: '欢迎使用家政服务平台，专业的家政服务让您的生活更美好！'
    }
  },
  onLoad() {
    // 获取分类列表
    this.getCategories()
    
    // 获取热门服务
    this.getHotServices()
  },
  methods: {
    getCategories() {
      uni.$http.get(API_CONFIG.endpoints.category.getCategories).then(res => {
        if (res.code === 200) {
          this.categories = res.data
        }
      }).catch(err => {
        console.error('获取分类失败', err)
      })
    },
    
    getHotServices() {
      uni.$http.get(API_CONFIG.endpoints.service.getServices, {
        page: 1,
        page_size: 4
      }).then(res => {
        if (res.code === 200) {
          this.hotServices = res.data.list
        }
      }).catch(err => {
        console.error('获取热门服务失败', err)
      })
    },
    
    goServiceList(categoryId) {
      if (categoryId) {
        ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.list, { category_id: categoryId })
      } else {
        ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list)
      }
    },
    
    goServiceDetail(serviceId) {
      ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.detail, { id: serviceId })
    }
  }
}
</script>

<style scoped>
.container {
  padding-bottom: 60px;
}

/* 轮播图 */
.banner {
  width: 100%;
  height: 180px;
}

.banner-image {
  width: 100%;
  height: 100%;
}

/* 分类导航 */
.category {
  display: flex;
  flex-wrap: wrap;
  padding: 20px 10px;
  background-color: white;
}

.category-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.category-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 12px;
  color: var(--text-color);
}

/* 热门服务 */
.hot-services {
  margin-top: 10px;
  padding: 0 16px 16px;
  background-color: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
}

.more {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.service-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.service-item {
  width: 48%;
  margin-bottom: 16px;
}

.service-image {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.service-title {
  font-size: 14px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: normal;
  height: 40px;
}

.service-price {
  font-size: 16px;
  color: var(--error-color);
  font-weight: bold;
  margin-top: 4px;
  display: block;
}

/* 公告 */
.notice {
  margin-top: 10px;
  padding: 12px 16px;
  background-color: white;
  display: flex;
  align-items: center;
}

.notice-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.notice-text {
  font-size: 14px;
  color: var(--text-color-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>