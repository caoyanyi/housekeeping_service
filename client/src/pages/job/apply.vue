<template>
  <view class="job-application-container">
    <view class="header">
      <text class="title">求职申请</text>
    </view>
    
    <view class="form-container">
      <form @submit="submitForm" class="application-form">
        <!-- 基本信息 -->
        <view class="form-section">
          <text class="section-title">基本信息</text>
          
          <view class="form-item">
            <text class="label">姓名 <text class="required">*</text></text>
            <input v-model="formData.name" type="text" placeholder="请输入您的姓名" required />
          </view>
          
          <view class="form-item">
            <text class="label">电话 <text class="required">*</text></text>
            <input v-model="formData.phone" type="number" placeholder="请输入您的手机号码" required />
          </view>
          
          <view class="form-item">
            <text class="label">身份证号 <text class="required">*</text></text>
            <input v-model="formData.id_card" type="text" placeholder="请输入您的身份证号" required />
          </view>
          
          <view class="form-item">
            <text class="label">住址</text>
            <input v-model="formData.address" type="text" placeholder="请输入您的居住地址" />
          </view>
          
          <view class="form-item">
            <text class="label">籍贯</text>
            <input v-model="formData.birth_place" type="text" placeholder="请输入您的籍贯" />
          </view>
        </view>
        
        <!-- 工作信息 -->
        <view class="form-section">
          <text class="section-title">工作信息</text>
          
          <view class="form-item">
            <text class="label">工作年限</text>
            <picker v-model="formData.work_years" :range="[0,1,2,3,4,5,6,7,8,9,10,'10+']" range-key="label">
              <view class="picker">
                {{ formData.work_years || '请选择工作年限' }}
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="label">工作区域</text>
            <input v-model="formData.work_area" type="text" placeholder="请输入您希望工作的区域" />
          </view>
        </view>
        
        <!-- 其他信息 -->
        <view class="form-section">
          <text class="section-title">其他信息</text>
          
          <view class="form-item">
            <text class="label">备注</text>
            <textarea v-model="formData.notes" placeholder="请输入其他补充信息" rows="4"></textarea>
          </view>
        </view>
        
        <!-- 提交按钮 -->
        <view class="submit-container">
          <button type="primary" form-type="submit" @click="submitForm" :loading="isSubmitting">
            提交申请
          </button>
        </view>
      </form>
    </view>
  </view>
</template>

<script>
import { ref, reactive } from 'vue';
import request from '../../utils/request.js';
import API_CONFIG from '../../config/api.config.js';

export default {
  name: 'JobApplication',
  setup() {
    // 表单数据
    const formData = reactive({
      name: '',
      phone: '',
      id_card: '',
      address: '',
      birth_place: '',
      work_years: '',
      work_area: '',
      notes: ''
    });
    
    // 提交状态
    const isSubmitting = ref(false);
    
    // 表单验证
    const validateForm = () => {
      if (!formData.name) {
        uni.showToast({ title: '请输入姓名', icon: 'none' });
        return false;
      }
      
      if (!formData.phone) {
        uni.showToast({ title: '请输入电话', icon: 'none' });
        return false;
      }
      
      // 简单的手机号验证
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        uni.showToast({ title: '请输入正确的手机号码', icon: 'none' });
        return false;
      }
      
      if (!formData.id_card) {
        uni.showToast({ title: '请输入身份证号', icon: 'none' });
        return false;
      }
      
      // 简单的身份证号验证
      const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      if (!idCardRegex.test(formData.id_card)) {
        uni.showToast({ title: '请输入正确的身份证号', icon: 'none' });
        return false;
      }
      
      return true;
    };
    
    // 提交表单
    const submitForm = async () => {
      if (!validateForm()) {
        return;
      }
      
      isSubmitting.value = true;
      
      try {
        const response = await request.http({
          url: API_CONFIG.endpoints.jobApplication.submitJobApplication,
          method: 'POST',
          data: formData
        });
        
        if (response.code === 200) {
          uni.showToast({ 
            title: '求职申请提交成功', 
            icon: 'success'
          });
          
          // 清空表单
          Object.keys(formData).forEach(key => {
            formData[key] = '';
          });
          
          // 延时返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({ 
            title: response.message || '提交失败，请重试', 
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('提交求职申请失败:', error);
        uni.showToast({ 
          title: '网络异常，请稍后重试', 
          icon: 'none'
        });
      } finally {
        isSubmitting.value = false;
      }
    };
    
    return {
      formData,
      isSubmitting,
      submitForm
    };
  }
};
</script>

<style scoped>
.job-application-container {
  padding: 0 30rpx 60rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #eee;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.form-container {
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
}

.application-form {
  padding: 20rpx 0;
}

.form-section {
  margin-bottom: 30rpx;
  padding: 0 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.required {
  color: #e64340;
}

input, textarea {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

textarea {
  height: 180rpx;
  padding: 20rpx;
  resize: none;
}

.picker {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  line-height: 80rpx;
  color: #999;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.submit-container {
  padding: 30rpx;
}

button {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  font-size: 32rpx;
  border-radius: 45rpx;
}
</style>