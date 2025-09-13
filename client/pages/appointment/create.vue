<template>
  <view>
    <!-- 简单的自定义日期选择器 - 移到最外层以确保正确的层级关系 -->
    <view v-if="showDatePicker" class="modal" @click.self="closeDatePicker">
      <view class="modal-overlay"></view>
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">选择日期</text>
          <button class="close-btn" @click="closeDatePicker">×</button>
        </view>
        <view class="date-picker-grid">
          <view 
            v-for="date in availableDates" 
            :key="date.value"
            :class="['date-item', { 'selected': date.value === selectedDate, 'disabled': !date.available }]"
            @click="selectDate(date.value)"
            :disabled="!date.available"
          >
            <text class="date-day">{{ date.day }}</text>
            <text class="date-week">{{ date.week }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.svg" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">预约服务</text>
      <view class="nav-right"></view>
    </view>

    <!-- 服务信息 -->
    <view class="service-info" v-if="serviceInfo">
      <image :src="serviceInfo.image" mode="aspectFill" class="service-image"></image>
      <view class="service-details">
        <text class="service-name">{{ serviceInfo.name }}</text>
        <text class="service-price">¥{{ serviceInfo.price }}</text>
        <text class="service-description">{{ serviceInfo.description }}</text>
      </view>
    </view>

    <!-- 预约表单 -->
    <view class="form-section">
      <text class="section-title">预约信息</text>
      
      <!-- 选择日期 -->
      <view class="form-item">
        <text class="form-label">预约日期</text>
        <div 
          class="form-input picker-view" 
          @click="openDatePicker"
          style="cursor: pointer;"
        >
          <span v-if="selectedDate">{{ formatDisplayDate(selectedDate) }}</span>
          <span v-else class="picker-text">请选择日期</span>
          <image src="/static/images/arrow-right.svg" mode="aspectFit" class="picker-icon"></image>
        </div>
      </view>

      <!-- 选择时间 - 使用原生HTML5时间输入框 -->
      <view class="form-item">
        <text class="form-label">预约时间</text>
        <input 
          type="time" 
          v-model="selectedTime" 
          placeholder="请选择时间" 
          class="form-input" 
          v-if="selectedDate"
        />
        <input 
          type="text" 
          value="请先选择日期" 
          placeholder="请选择时间" 
          class="form-input" 
          readonly 
          v-else
        />
      </view>

      <!-- 技师选择已移除，由后台自动派单 -->

      <!-- 联系人姓名 -->
      <view class="form-item">
        <text class="form-label">联系人姓名</text>
        <input type="text" v-model="contactName" placeholder="请输入联系人姓名" class="form-input" />
      </view>

      <!-- 联系电话 -->
      <view class="form-item">
        <text class="form-label">联系电话</text>
        <input type="number" v-model="phone" placeholder="请输入联系电话" class="form-input" />
      </view>

      <!-- 服务地址 -->
      <view class="form-item">
        <text class="form-label">服务地址</text>
        <textarea v-model="address" placeholder="请输入服务地址" class="form-textarea" maxlength="200"></textarea>
      </view>

      <!-- 备注 -->
      <view class="form-item">
        <text class="form-label">备注信息</text>
        <textarea v-model="remark" placeholder="请输入备注信息（选填）" class="form-textarea" maxlength="200"></textarea>
      </view>
    </view>

    <!-- 提交按钮 -->
    <button class="submit-button" :disabled="!canSubmit" @click="submitAppointment">确认预约</button>

    <!-- 加载状态 -->
    <view class="loading" v-if="loading">
      <text>加载中...</text>
</view>
    </view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config';

export default {
    name: 'appointment-create',
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
            showDatePicker: false,
            availableDates: []
        };
    },
    computed: {
        canSubmit() {
            return this.selectedDate && this.selectedTime && this.contactName && this.phone && this.address;
        },
        minDate() {
            const today = new Date();
            return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        },
        maxDate() {
            const today = new Date();
            const endDate = new Date(today.setMonth(today.getMonth() + 1));
            return `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
        }
    },
    onLoad(options) {
        if(options.serviceId) {
            this.serviceId = options.serviceId;
            // 由于uni.getStorageSync不可用，使用localStorage替代
            this.token = localStorage.getItem('token') || '';
            this.getServiceInfo();
            // 获取当前登录用户的电话
            this.getUserInfo();
        }

        // 生成可用日期列表
        this.generateAvailableDates();
    },
    methods: {
        getServiceInfo() {
            this.loading = true;
            console.log('获取服务信息，serviceId:', this.serviceId);

            // 检查serviceId是否存在
            if (!this.serviceId) {
                this.loading = false;
                alert('服务ID不存在');
                return;
            }

            this.$request.get(`${API_CONFIG.endpoints.service.getServices}/${this.serviceId}`, {}, {
                header: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                console.log('获取服务信息响应:', res);
                this.loading = false;

                if(res.code === 200) {
                    this.serviceInfo = res.data;
                    // 不再需要获取技师列表，由后台自动派单
                } else {
                    alert(res.msg || '获取服务信息失败');
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取服务信息失败', err);
                alert('网络错误，请重试');
            });
        },

        getUserInfo() {
            console.log('获取用户信息，token:', this.token);
            this.$request.get(API_CONFIG.endpoints.user.getUserInfo, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                console.log('获取用户信息响应:', res);
                if(res.code === 200) {
                    this.phone = res.data.phone || '';
                    this.contactName = res.data.nickname || '';
                    this.address = res.data.address || '';
                }
            }).catch((err) => {
                console.error('获取用户信息失败', err);
            });
        },
        
        // 日期变更时清除已选时间
        onDateChange() {
            this.selectedTime = '';
        },
        
        // 打开日期选择器
        openDatePicker() {
            this.showDatePicker = true;
        },
        
        // 关闭日期选择器
        closeDatePicker() {
            this.showDatePicker = false;
        },
        
        // 选择日期
        selectDate(dateValue) {
            this.selectedDate = dateValue;
            this.selectedTime = ''; // 清除已选时间
            this.showDatePicker = false;
        },
        
        // 格式化显示的日期
        formatDisplayDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const week = weekDays[date.getDay()];
            return `${year}-${month}-${day} ${week}`;
        },
        
        // 生成可用日期列表
        generateAvailableDates() {
            const dates = [];
            const today = new Date();
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            
            // 生成未来30天的日期
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                
                dates.push({
                    value: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
                    day: date.getDate(),
                    week: weekDays[date.getDay()],
                    available: true // 默认为可用，实际项目中可能需要根据后端数据判断
                });
            }
            
            this.availableDates = dates;
        },

        submitAppointment() {
            // 验证表单
            if(!/^1[3-9]\d{9}$/.test(this.phone)) {
                alert('请输入正确的手机号码');
                return;
            }

            this.loading = true;

            const appointmentData = {
                service_id: this.serviceId,
                appointment_date: this.selectedDate,
                appointment_time: this.selectedTime,
                contact_name: this.contactName,
                contact_phone: this.phone,
                address: this.address,
                notes: this.remark
            };

            console.log('提交的预约数据:', appointmentData);
            this.$request.post(`${API_CONFIG.endpoints.appointment.createAppointment}`, appointmentData, {                header: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    alert('预约成功');

                    // 预约成功后，跳转到预约详情页或预约列表页
                    setTimeout(() => {
                        window.location.href = `/#/pages/appointment/list?appointmentId=${res.data.id}`;
                    }, 1500);
                } else {
                    alert(res.msg || '预约失败');
                }
            }).catch((err) => {
                this.loading = false;
                console.error('提交预约失败', err);
                alert('网络错误，请重试');
            });
        },

        goBack() {
            // 由于ROUTER_CONFIG.navigate.back()不可用，使用原生JavaScript返回上一页
            window.history.back();
        }
    }
};
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

/* 服务信息 */
.service-info {
  margin-top: 44px;
  background-color: white;
  padding: 16px;
}

.service-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.service-details {
  padding-left: 8px;
}

.service-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.service-price {
  font-size: 16px;
  color: var(--danger-color);
  display: block;
  margin-bottom: 8px;
}

.service-description {
  font-size: 14px;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

/* 表单区域 */
.form-section {
  margin-top: 10px;
  background-color: white;
  padding: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 20px;
  display: block;
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

.form-input {
  width: 100%;
  height: 44px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
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

.form-textarea {
  width: 100%;
  height: 100px;
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  resize: none;
}

/* 提交按钮 */
.submit-button {
  width: calc(100% - 32px);
  height: 48px;
  background-color: var(--primary-color);
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-radius: 24px;
  margin: 20px 16px 0;
  padding: 0;
}

.submit-button:disabled {
  background-color: var(--primary-color-disabled);
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 自定义日期选择器样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: white;
  width: 100%;
  max-height: 70vh;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  z-index: 1;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eeeeee;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.date-picker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 20px;
}

.date-item {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.date-item:hover {
  background-color: #f5f5f5;
}

.date-item.selected {
  background-color: var(--primary-color);
  color: white;
}

.date-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-day {
  font-size: 16px;
  font-weight: 500;
}

.date-week {
  font-size: 12px;
  margin-top: 2px;
}
</style>