<template>
  <view class="container">
    <!-- 服务图片轮播 -->
    <swiper class="image-swiper" @change="onSwiperChange">
      <swiper-item v-for="(image, index) in service.image_urls" :key="index">
        <image :src="image" mode="aspectFill" class="service-image"></image>
      </swiper-item>
    </swiper>
    <view class="image-count">{{ currentImageIndex + 1 }}/{{ service.image_urls.length }}</view>
    
    <!-- 服务基本信息 -->
    <view class="service-info">
      <text class="service-title">{{ service.title }}</text>
      <view class="service-price">
        <text class="price-tag">¥</text>
        <text class="price-number">{{ service.price }}</text>
        <text class="price-unit">起</text>
      </view>
      <text class="service-description">{{ service.description }}</text>
      <view class="service-meta">
        <view class="meta-item">
          <text class="meta-label">服务时长</text>
          <text class="meta-value">{{ service.duration }}分钟</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">服务分类</text>
          <text class="meta-value">{{ service.category_name }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">服务人员</text>
          <text class="meta-value">{{ service.provider }}</text>
        </view>
      </view>
    </view>
    
    <!-- 服务详情内容 -->
    <view class="service-content">
      <view class="section-title">服务详情</view>
      <rich-text :nodes="service.content"></rich-text>
    </view>
    
    <!-- 底部预约按钮 -->
    <view class="bottom-bar">
      <view class="contact-info">
        <text class="phone">客服电话：400-123-4567</text>
      </view>
      <button class="book-button" @click="showBookDialog">立即预约</button>
    </view>
    
    <!-- 预约弹窗 -->
    <view class="book-dialog" v-if="showBook">
      <view class="dialog-content">
        <view class="dialog-header">
          <text class="dialog-title">预约服务</text>
          <image src="/static/images/close.png" mode="aspectFit" class="close-icon" @click="closeBookDialog"></image>
        </view>
        <view class="dialog-body">
          <view class="form-item">
            <text class="form-label">服务日期</text>
            <picker mode="date" :value="bookForm.date" @change="onDateChange" class="form-picker">
              <view class="picker-content">{{ bookForm.date }}</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">服务时间</text>
            <picker mode="time" :value="bookForm.time" @change="onTimeChange" class="form-picker">
              <view class="picker-content">{{ bookForm.time }}</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">服务地址</text>
            <input type="text" v-model="bookForm.address" placeholder="请输入服务地址" class="form-input" />
          </view>
          <view class="form-item">
            <text class="form-label">备注信息</text>
            <textarea v-model="bookForm.note" placeholder="请输入备注信息" class="form-textarea" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="cancel-button" @click="closeBookDialog">取消</button>
          <button class="confirm-button" @click="submitBook">确认预约</button>
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
import API_CONFIG from '../../config/api.config.js';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config.js';

export default {
  data() {
    return {
      serviceId: null,
      service: {
        title: '',
        price: 0,
        description: '',
        duration: 0,
        category_name: '',
        provider: '',
        content: '',
        image_urls: []
      },
      currentImageIndex: 0,
      showBook: false,
      loading: false,
      bookForm: {
        date: '',
        time: '',
        address: '',
        note: ''
      }
    }
  },
  onLoad(options) {
    if (options && options.id) {
      this.serviceId = options.id
      this.getServiceDetail()
    }
    
    // 设置默认日期和时间
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const hours = today.getHours().toString().padStart(2, '0')
    const minutes = Math.ceil(today.getMinutes() / 15) * 15
    const formattedMinutes = minutes.toString().padStart(2, '0')
    
    this.bookForm.date = `${year}-${month}-${day}`
    this.bookForm.time = `${hours}:${formattedMinutes}`
  },
  methods: {
    getServiceDetail() {
      this.loading = true
      
      uni.$http.get(API_CONFIG.endpoints.service.getService, { id: this.serviceId }).then(res => {
        this.loading = false
        
        if (res.code === 200) {
          this.service = res.data
          // 处理图片URLs
          if (typeof this.service.image_urls === 'string') {
            try {
              this.service.image_urls = JSON.parse(this.service.image_urls)
            } catch (e) {
              this.service.image_urls = [this.service.image_urls]
            }
          }
        } else {
          uni.showToast({
            title: res.msg || '获取服务详情失败',
            icon: 'none'
          })
        }
      }).catch(err => {
        this.loading = false
        console.error('获取服务详情失败', err)
        
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      })
    },
    
    onSwiperChange(e) {
      this.currentImageIndex = e.detail.current
    },
    
    showBookDialog() {
      // 检查是否登录
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }
          }
        })
        return
      }
      
      this.showBook = true
    },
    
    closeBookDialog() {
      this.showBook = false
    },
    
    onDateChange(e) {
      this.bookForm.date = e.detail.value
    },
    
    onTimeChange(e) {
      this.bookForm.time = e.detail.value
    },
    
    submitBook() {
      // 表单验证
      if (!this.bookForm.date) {
        uni.showToast({
          title: '请选择服务日期',
          icon: 'none'
        })
        return
      }
      
      if (!this.bookForm.time) {
        uni.showToast({
          title: '请选择服务时间',
          icon: 'none'
        })
        return
      }
      
      if (!this.bookForm.address) {
        uni.showToast({
          title: '请输入服务地址',
          icon: 'none'
        })
        return
      }
      
      // 提交预约
      const token = uni.getStorageSync('token')
      
      uni.$http.post(API_CONFIG.endpoints.appointment.createAppointment, {
        service_id: this.serviceId,
        appointment_date: this.bookForm.date,
        appointment_time: this.bookForm.time,
        address: this.bookForm.address,
        note: this.bookForm.note
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => {
        if (res.code === 200) {
          uni.showToast({
            title: '预约成功',
            icon: 'success'
          })
          
          // 关闭弹窗并跳转
            setTimeout(() => {
              this.closeBookDialog()
              // 跳转到预约列表页面
              ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointmentList)
            }, 1500)
        } else {
          uni.showToast({
            title: res.msg || '预约失败',
            icon: 'none'
          })
        }
      }).catch(err => {
        console.error('提交预约失败', err)
        
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding-bottom: 60px;
}

/* 图片轮播 */
.image-swiper {
  width: 100%;
  height: 300px;
}

.service-image {
  width: 100%;
  height: 100%;
}

.image-count {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
}

/* 服务基本信息 */
.service-info {
  padding: 16px;
  background-color: white;
  margin-bottom: 10px;
}

.service-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.service-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}

.price-tag {
  font-size: 14px;
  color: var(--error-color);
}

.price-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--error-color);
  margin: 0 2px;
}

.price-unit {
  font-size: 14px;
  color: var(--error-color);
}

.service-description {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 20px;
  margin-bottom: 16px;
}

.service-meta {
  display: flex;
  flex-wrap: wrap;
}

.meta-item {
  width: 50%;
  display: flex;
  margin-bottom: 8px;
}

.meta-label {
  font-size: 12px;
  color: var(--text-color-disabled);
  margin-right: 8px;
}

.meta-value {
  font-size: 12px;
  color: var(--text-color-secondary);
}

/* 服务详情内容 */
.service-content {
  padding: 16px;
  background-color: white;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 12px;
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
  padding: 0 16px;
  justify-content: space-between;
}

.contact-info {
  flex: 1;
}

.phone {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.book-button {
  width: 160px;
  height: 40px;
  background-color: var(--primary-color);
  color: white;
  font-size: 16px;
  line-height: 40px;
  border-radius: 20px;
  padding: 0;
}

/* 预约弹窗 */
.book-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.dialog-content {
  background-color: white;
  width: 100%;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eeeeee;
}

.dialog-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
}

.close-icon {
  width: 24px;
  height: 24px;
}

.dialog-body {
  padding: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.form-picker {
  width: 100%;
  height: 44px;
  background-color: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.picker-content {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.form-input {
  width: 100%;
  height: 44px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  height: 100px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
}

.dialog-footer {
  display: flex;
  padding: 16px;
  border-top: 1px solid #eeeeee;
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
}
</style>