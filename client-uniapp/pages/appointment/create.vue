<template>
  <view class="container">
    <view class="header">
      <text class="title">预约服务</text>
    </view>
    
    <view class="form-container">
      <!-- 服务信息 -->
      <view class="service-info" v-if="serviceInfo">
        <image :src="serviceInfo.image_urls[0]" mode="aspectFill" class="service-image"></image>
        <view class="service-details">
          <text class="service-title">{{ serviceInfo.title }}</text>
          <text class="service-price">¥{{ serviceInfo.price }}</text>
        </view>
      </view>
      
      <!-- 预约表单 -->
      <view class="form">
        <!-- 预约日期 -->
        <view class="form-item">
          <text class="label">预约日期</text>
          <picker mode="date" :start="minDate" :end="maxDate" :value="appointmentDate" @change="onDateChange">
            <view class="picker">
              {{ appointmentDate || '请选择日期' }}
            </view>
          </picker>
        </view>
        
        <!-- 预约时间 -->
        <view class="form-item">
          <text class="label">预约时间</text>
          <picker mode="time" :value="appointmentTime" @change="onTimeChange">
            <view class="picker">
              {{ appointmentTime || '请选择时间' }}
            </view>
          </picker>
        </view>
        
        <!-- 服务地址 -->
        <view class="form-item">
          <text class="label">服务地址</text>
          <input type="text" v-model="address" placeholder="请输入服务地址" />
        </view>
        
        <!-- 联系方式 -->
        <view class="form-item">
          <text class="label">联系电话</text>
          <input type="number" v-model="phone" placeholder="请输入联系电话" />
        </view>
        
        <!-- 备注信息 -->
        <view class="form-item">
          <text class="label">备注信息</text>
          <textarea v-model="remark" placeholder="请输入备注信息（选填）" rows="4"></textarea>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="submitAppointment" :loading="isLoading">提交预约</button>
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
      serviceId: '',
      serviceInfo: null,
      appointmentDate: '',
      appointmentTime: '',
      address: '',
      phone: '',
      remark: '',
      isLoading: false,
      minDate: '',
      maxDate: ''
    }
  },
  onLoad(options) {
    if (options.id) {
      this.serviceId = options.id;
      this.getServiceDetail();
    }
    
    // 设置日期范围（今天到30天后）
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    
    // 格式化日期为YYYY-MM-DD格式
    this.minDate = this.formatDate(today);
    this.maxDate = this.formatDate(maxDate);
  },
  methods: {
    // 获取服务详情
    getServiceDetail() {
      this.isLoading = true;
      uni.$http.get(`${API_CONFIG.endpoints.service.getService}/${this.serviceId}`).then(res => {
        this.isLoading = false;
        if (res.code === 200) {
          this.serviceInfo = res.data;
        }
      }).catch(err => {
        this.isLoading = false;
        console.error('获取服务详情失败', err);
        uni.showToast({
          title: '获取服务详情失败',
          icon: 'none'
        });
      });
    },
    
    // 日期选择
    onDateChange(e) {
      this.appointmentDate = e.detail.value;
    },
    
    // 时间选择
    onTimeChange(e) {
      this.appointmentTime = e.detail.value;
    },
    
    // 提交预约
    submitAppointment() {
      // 表单验证
      if (!this.serviceId) {
        return uni.showToast({ title: '请选择服务', icon: 'none' });
      }
      if (!this.appointmentDate) {
        return uni.showToast({ title: '请选择预约日期', icon: 'none' });
      }
      if (!this.appointmentTime) {
        return uni.showToast({ title: '请选择预约时间', icon: 'none' });
      }
      if (!this.address) {
        return uni.showToast({ title: '请输入服务地址', icon: 'none' });
      }
      if (!this.phone) {
        return uni.showToast({ title: '请输入联系电话', icon: 'none' });
      }
      
      // 提交预约
      this.isLoading = true;
      
      // 构建预约数据
      const appointmentData = {
        service_id: this.serviceId,
        appointment_date: this.appointmentDate,
        appointment_time: this.appointmentTime,
        address: this.address,
        phone: this.phone,
        remark: this.remark
      };
      
      // 调用创建预约API
      uni.$http.post(API_CONFIG.endpoints.appointment.createAppointment, appointmentData).then(res => {
        this.isLoading = false;
        if (res.code === 200) {
          // 预约成功，显示提示并跳转到预约列表页
          uni.showToast({
            title: '预约成功',
            icon: 'success'
          });
          
          // 延时跳转
          setTimeout(() => {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
          }, 1500);
        }
      }).catch(err => {
        this.isLoading = false;
        console.error('提交预约失败', err);
        uni.showToast({
          title: '提交预约失败',
          icon: 'none'
        });
      });
    },
    
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
};
</script>

<style scoped>
.container {
  padding-bottom: 20px;
  background-color: #f5f5f5;
}

.header {
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.form-container {
  padding: 16px;
  background-color: #fff;
  margin-top: 10px;
}

.service-info {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.service-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.service-details {
  flex: 1;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.service-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.service-price {
  font-size: 18px;
  color: #e64340;
  font-weight: bold;
}

.form {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

input,
textarea,
.picker {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
}

input::placeholder,
textarea::placeholder {
  color: #999;
}

textarea {
  height: 100px;
  resize: none;
}

.picker {
  position: relative;
  background-color: #fff;
}

.picker::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  transform: translateY(-50%) rotate(-45deg);
}

.submit-btn {
  width: 100%;
  background-color: #1AAD19;
  color: #fff;
  font-size: 16px;
  padding: 12px;
  border-radius: 6px;
  border: none;
}

.submit-btn:active {
  background-color: #179B16;
}
</style>