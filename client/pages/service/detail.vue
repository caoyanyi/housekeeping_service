<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.svg" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">服务详情</text>
      <view class="nav-right"></view>
    </view>

    <!-- 服务图片轮播 -->
    <view class="swiper-container" v-if="serviceInfo">
      <swiper class="swiper" indicator-dots circular autoplay>
        <swiper-item v-for="image in serviceImages" :key="image">
          <image :src="image" mode="aspectFill" class="swiper-image"></image>
        </swiper-item>
      </swiper>
    </view>

    <!-- 服务基本信息 -->
    <view class="info-section" v-if="serviceInfo">
      <text class="service-name">{{ serviceInfo.name }}</text>
      <text class="service-price">¥{{ serviceInfo.price }}</text>
      <text class="service-sales">销量 {{ serviceInfo.sales || 0 }} | 评价 {{ serviceInfo.ratings || 0 }}</text>
      
      <!-- 服务标签 -->
      <view class="tags-container">
        <view class="tag" v-for="tag in serviceTags" :key="tag">{{ tag }}</view>
      </view>
    </view>

    <!-- 服务详情内容 -->
    <view class="detail-section" v-if="serviceInfo">
      <text class="section-title">服务详情</text>
      <rich-text class="detail-content" :nodes="serviceInfo.description"></rich-text>
    </view>

    <!-- 服务流程 -->
    <view class="process-section" v-if="serviceInfo?.process && serviceInfo.process.length > 0">
      <text class="section-title">服务流程</text>
      <view class="process-list">
        <view class="process-item" v-for="(step, index) in serviceInfo.process" :key="index">
          <view class="step-number">{{ index + 1 }}</view>
          <text class="step-text">{{ step }}</text>
        </view>
      </view>
    </view>

    <!-- 技师推荐 -->
    <view class="technicians-section" v-if="technicians && technicians.length > 0">
      <text class="section-title">推荐技师</text>
      <scroll-view class="technicians-scroll" scroll-x>
        <view class="technician-item" v-for="technician in technicians" :key="technician.id">
          <image :src="technician.avatar" mode="aspectFit" class="technician-avatar"></image>
          <text class="technician-name">{{ technician.name }}</text>
          <text class="technician-level">{{ technician.level }}</text>
          <text class="technician-score">{{ technician.score || 4.9 }}分</text>
        </view>
      </scroll-view>
    </view>

    <!-- 用户评价 -->
    <view class="reviews-section" v-if="reviews && reviews.length > 0">
      <text class="section-title">用户评价</text>
      <view class="review-item" v-for="review in reviews" :key="review.id">
        <view class="review-header">
          <image :src="review.user_avatar" mode="aspectFit" class="user-avatar"></image>
          <text class="user-name">{{ review.user_name }}</text>
          <text class="review-time">{{ review.created_at }}</text>
        </view>
        <text class="review-content">{{ review.content }}</text>
        <view class="review-images" v-if="review.images && review.images.length > 0">
          <image :src="image" mode="aspectFit" class="review-image" v-for="image in review.images" :key="image"></image>
        </view>
      </view>
    </view>

    <!-- 底部预约按钮 -->
    <view class="bottom-bar" v-if="serviceInfo">
      <button class="appointment-button" @click="makeAppointment">立即预约</button>
    </view>

    <!-- 预约弹窗 -->
    <view class="appointment-dialog" v-if="showAppointmentDialog">
      <view class="appointment-content">
        <text class="appointment-title">确认预约</text>
        <text class="appointment-service">{{ serviceInfo.name }}</text>
        <text class="appointment-price">¥{{ serviceInfo.price.toFixed(2) }}</text>
        
        <view class="form-item">
          <text class="form-label">选择技师</text>
          <picker @change="onTechnicianChange" :range="technicians" :range-key="'name'" mode="selector">
            <view class="picker-view">
              <text class="picker-text">{{ selectedTechnician ? selectedTechnician.name : '请选择技师' }}</text>
              <image src="/static/images/arrow_right.svg" mode="aspectFit" class="picker-icon"></image>
            </view>
          </picker>
        </view>
        
        <view class="dialog-buttons">
          <button class="cancel-button" @click="cancelAppointment">取消</button>
          <button class="confirm-button" @click="confirmAppointment">确定</button>
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
    name: 'service-detail',
    data() {
        return {
            serviceId: '',
            serviceInfo: null,
            technicians: [],
            reviews: [],
            selectedTechnician: null,
            showAppointmentDialog: false,
            loading: false,
            token: ''
        };
    },
    onLoad(options) {
        if(options.serviceId) {
            this.serviceId = options.serviceId;
            this.token = uni.getStorageSync('token');
            this.getServiceDetail();
            this.getReviews();
        }
    },
    computed: {
        serviceImages() {
            // 如果服务信息有图片，返回图片数组，否则返回默认图片
            if(this.serviceInfo && this.serviceInfo.images) {
                return this.serviceInfo.images.split(',');
            }
            return ['/static/images/default_service.svg'];
        },
        serviceTags() {
            // 如果服务信息有标签，返回标签数组，否则返回空数组
            if(this.serviceInfo && this.serviceInfo.tags) {
                return this.serviceInfo.tags.split(',');
            }
            return [];
        }
    },
    methods: {
        getServiceDetail() {
            this.loading = true;
            this.$request.get(`${API_CONFIG.endpoints.service.getServices}/${this.serviceId}`, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    this.serviceInfo = res.data;
                    // 模拟评价数据，因为API中没有reviews接口
                    this.reviews = res.data.reviews || [];
                } else {
                    uni.showToast({
                        title: res.msg || '获取服务详情失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取服务详情失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        },

        makeAppointment() {
            // 检查用户是否登录
            const token = uni.getStorageSync('token');
            if(!token) {
                uni.showModal({
                    title: '提示',
                    content: '请先登录',
                    success: (res) => {
                        if(res.confirm) {
                            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
                        }
                    }
                });
                return;
            }

            this.showAppointmentDialog = true;
        },

        onTechnicianChange(e) {
            const index = e.detail.value;
            this.selectedTechnician = this.technicians[index];
        },

        cancelAppointment() {
            this.showAppointmentDialog = false;
            this.selectedTechnician = null;
        },

        confirmAppointment() {
            if(!this.selectedTechnician) {
                uni.showToast({
                    title: '请选择技师',
                    icon: 'none'
                });
                return;
            }

            this.showAppointmentDialog = false;

            // 跳转到预约页面
            ROUTER_CONFIG.navigate.to({
                url: `${ROUTER_CONFIG.pages.appointmentCreate}?serviceId=${this.serviceId}&technicianId=${this.selectedTechnician.id}`
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
  padding-bottom: 80px;
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

/* 轮播图 */
.swiper-container {
  margin-top: 44px;
}

.swiper {
  height: 300px;
}

.swiper-image {
  width: 100%;
  height: 100%;
}

/* 基本信息 */
.info-section {
  background-color: white;
  padding: 16px;
  border-bottom: 1px solid #eeeeee;
}

.service-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.service-price {
  font-size: 18px;
  color: var(--danger-color);
  display: block;
  margin-bottom: 8px;
}

.service-sales {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.tags-container {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 12px;
  background-color: #f0f0f0;
  color: var(--text-color-secondary);
  font-size: 12px;
  border-radius: 12px;
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 详情内容 */
.detail-section,
.process-section,
.technicians-section,
.reviews-section {
  margin-top: 10px;
  background-color: white;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 16px;
  display: block;
}

.detail-content {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.8;
}

/* 服务流程 */
.process-list {
  padding-left: 16px;
}

.process-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.process-item::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 20px;
  bottom: -16px;
  width: 1px;
  background-color: #eeeeee;
}

.process-item:last-child::before {
  display: none;
}

.step-number {
  width: 24px;
  height: 24px;
  background-color: var(--primary-color);
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  position: relative;
  z-index: 1;
}

.step-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.5;
}

/* 技师推荐 */
.technicians-scroll {
  white-space: nowrap;
}

.technician-item {
  display: inline-block;
  width: 100px;
  text-align: center;
  margin-right: 16px;
}

.technician-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 8px;
}

.technician-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 4px;
}

.technician-level {
  font-size: 12px;
  color: var(--text-color-secondary);
  display: block;
  margin-bottom: 4px;
}

.technician-score {
  font-size: 12px;
  color: var(--danger-color);
}

/* 用户评价 */
.review-item {
  padding: 16px 0;
  border-bottom: 1px solid #eeeeee;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.user-name {
  font-size: 14px;
  color: var(--text-color);
  margin-right: 12px;
}

.review-time {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.review-content {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.5;
  margin-bottom: 12px;
  display: block;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
}

.review-image {
  width: 80px;
  height: 80px;
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
}

/* 底部预约按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: white;
  border-top: 1px solid #eeeeee;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.appointment-button {
  width: 100%;
  height: 44px;
  background-color: var(--primary-color);
  color: white;
  font-size: 16px;
  border-radius: 22px;
  padding: 0;
}

/* 预约弹窗 */
.appointment-dialog {
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

.appointment-content {
  width: 80%;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
}

.appointment-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 16px;
}

.appointment-service {
  display: block;
  font-size: 16px;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 8px;
}

.appointment-price {
  display: block;
  font-size: 16px;
  color: var(--danger-color);
  text-align: center;
  margin-bottom: 20px;
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
  margin-top: 44px;
}
</style>