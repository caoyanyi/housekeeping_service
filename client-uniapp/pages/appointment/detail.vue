<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.png" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">预约详情</text>
      <view class="nav-right"></view>
    </view>
    
    <!-- 预约基本信息 -->
    <view class="appointment-basic">
      <text class="status" :class="appointment.status">{{ getStatusText(appointment.status) }}</text>
      <text class="service-title">{{ appointment.service_title }}</text>
      <text class="service-price">¥{{ appointment.price }}</text>
    </view>
    
    <!-- 预约详情信息 -->
    <view class="appointment-details">
      <view class="detail-item">
        <text class="detail-label">预约时间</text>
        <text class="detail-value">{{ appointment.appointment_date }} {{ appointment.appointment_time }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">服务地址</text>
        <text class="detail-value">{{ appointment.address }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">服务人员</text>
        <text class="detail-value">{{ appointment.provider || '未分配' }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">联系电话</text>
        <text class="detail-value">{{ appointment.phone }}</text>
        <button class="call-button" @click="makeCall">拨打</button>
      </view>
      <view class="detail-item" v-if="appointment.note">
        <text class="detail-label">备注信息</text>
        <text class="detail-value">{{ appointment.note }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">预约单号</text>
        <text class="detail-value">{{ appointment.order_no }}</text>
      </view>
      <view class="detail-item">
        <text class="detail-label">创建时间</text>
        <text class="detail-value">{{ appointment.created_at }}</text>
      </view>
      <view class="detail-item" v-if="appointment.updated_at">
        <text class="detail-label">更新时间</text>
        <text class="detail-value">{{ appointment.updated_at }}</text>
      </view>
    </view>
    
    <!-- 服务详情 -->
    <view class="service-section">
      <text class="section-title">服务详情</text>
      <view class="service-content">
        <image :src="appointment.service_image" mode="aspectFill" class="service-image"></image>
        <rich-text :nodes="appointment.service_content"></rich-text>
      </view>
    </view>
    
    <!-- 底部操作按钮 -->
    <view class="bottom-actions" v-if="canCancel">
      <button class="cancel-button" @click="cancelAppointment">取消预约</button>
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
      appointmentId: null,
      appointment: {
        status: '',
        service_title: '',
        price: 0,
        appointment_date: '',
        appointment_time: '',
        address: '',
        provider: '',
        phone: '',
        note: '',
        order_no: '',
        created_at: '',
        updated_at: '',
        service_image: '',
        service_content: ''
      },
      loading: false,
      token: ''
    }
  },
  onLoad(options) {
    if (options && options.id) {
      this.appointmentId = options.id
      this.token = uni.getStorageSync('token')
      if (!this.token) {
        // 如果没有token，跳转到登录页
        uni.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      
      this.getAppointmentDetail()
    }
  },
  computed: {
    canCancel() {
      // 只有待接单状态的预约可以取消
      return this.appointment.status === 'pending'
    }
  },
  methods: {
    getAppointmentDetail() {
      this.loading = true
      
      uni.$http.get(`${API_CONFIG.endpoints.appointment.getAppointment}/${this.appointmentId}`, {}, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }).then(res => {
        this.loading = false
        
        if (res.code === 200) {
          this.appointment = res.data
        } else {
          uni.showToast({
            title: res.msg || '获取预约详情失败',
            icon: 'none'
          })
        }
      }).catch(err => {
        this.loading = false
        console.error('获取预约详情失败', err)
        
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
      })
    },
    
    goBack() {
      ROUTER_CONFIG.navigate.back()
    },
    
    getStatusText(status) {
      const statusMap = {
        pending: '待接单',
        accepted: '已接单',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },
    
    makeCall() {
      if (this.appointment.phone) {
        uni.makePhoneCall({
          phoneNumber: this.appointment.phone
        })
      }
    },
    
    cancelAppointment() {
      uni.showModal({
        title: '提示',
        content: '确定要取消此预约吗？',
        success: (res) => {
          if (res.confirm) {
            this.loading = true
            
            uni.$http.put(`${API_CONFIG.endpoints.appointment.updateAppointmentStatus}/${this.appointmentId}/status`, {
              status: 'cancelled'
            }, {
              headers: {
                'Authorization': `Bearer ${this.token}`
              }
            }).then(res => {
              this.loading = false
              
              if (res.code === 200) {
                uni.showToast({
                  title: '预约已取消',
                  icon: 'success'
                })
                
                // 更新本地状态
                this.appointment.status = 'cancelled'
              } else {
                uni.showToast({
                  title: res.msg || '取消失败',
                  icon: 'none'
                })
              }
            }).catch(err => {
              this.loading = false
              console.error('取消预约失败', err)
              
              uni.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              })
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding-bottom: 20px;
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

/* 预约基本信息 */
.appointment-basic {
  padding: 16px;
  background-color: white;
  margin-top: 44px;
  margin-bottom: 10px;
}

.status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 12px;
}

.status.pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status.accepted {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status.completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.status.cancelled {
  background-color: #f5f5f5;
  color: var(--text-color-disabled);
}

.service-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.service-price {
  font-size: 16px;
  color: var(--error-color);
  font-weight: bold;
}

/* 预约详情信息 */
.appointment-details {
  background-color: white;
  margin-bottom: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eeeeee;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: var(--text-color-secondary);
  min-width: 80px;
}

.detail-value {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
}

.call-button {
  height: 32px;
  background-color: var(--primary-color);
  color: white;
  font-size: 12px;
  line-height: 32px;
  border-radius: 16px;
  padding: 0 16px;
}

/* 服务详情 */
.service-section {
  background-color: white;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 12px;
  display: block;
}

.service-content {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.service-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* 底部操作按钮 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: white;
  border-top: 1px solid #eeeeee;
}

.cancel-button {
  width: 100%;
  height: 44px;
  background-color: var(--error-color);
  color: white;
  font-size: 16px;
  line-height: 44px;
  border-radius: 8px;
  padding: 0;
}

/* 加载状态 */
.loading {
  margin-top: 44px;
  padding: 40px 0;
  text-align: center;
  color: var(--text-color-secondary);
}
</style>