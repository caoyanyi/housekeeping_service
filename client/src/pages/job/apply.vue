<template>
  <view class="job-application-container">
    <view class="hero-card">
      <text class="hero-eyebrow">家政从业者入口</text>
      <text class="hero-title">提交资料后，平台会按区域和能力继续跟进</text>
      <text class="hero-subtitle">先把基础信息、可工作区域和经验补充清楚，能明显提升首轮联系效率。</text>
      <view class="hero-steps">
        <view v-for="item in heroSteps" :key="item.title" class="hero-step">
          <text class="hero-step-badge">{{ item.step }}</text>
          <view class="hero-step-copy">
            <text class="hero-step-title">{{ item.title }}</text>
            <text class="hero-step-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-head">
        <text class="summary-title">提交准备度</text>
        <text class="summary-text">{{ summaryText }}</text>
      </view>
      <view class="summary-progress">
        <view class="summary-progress-bar" :style="{ width: `${completionRate}%` }"></view>
      </view>
    </view>

    <view class="tips-card">
      <view v-for="item in readinessItems" :key="item.label" class="tips-item">
        <text class="tips-badge" :class="{ done: item.done }">{{ item.done ? '已就绪' : '待补充' }}</text>
        <view class="tips-copy">
          <text class="tips-title">{{ item.label }}</text>
          <text class="tips-text">{{ item.text }}</text>
        </view>
      </view>
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

        <view class="journey-card">
          <text class="journey-title">提交后会发生什么</text>
          <view class="journey-list">
            <view v-for="item in submitJourney" :key="item.step" class="journey-item">
              <text class="journey-step">{{ item.step }}</text>
              <view class="journey-copy">
                <text class="journey-item-title">{{ item.title }}</text>
                <text class="journey-item-desc">{{ item.desc }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 提交按钮 -->
        <view class="submit-container">
          <button type="primary" form-type="submit" @click="submitForm" :loading="isSubmitting">
            {{ submitButtonText }}
          </button>
        </view>
      </form>
    </view>
  </view>
</template>

<script>
import { ref, reactive, computed } from 'vue';
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

    const heroSteps = [
      {
        step: '01',
        title: '提交基础资料',
        desc: '姓名、电话和身份证信息会决定平台能否进入首轮筛选。'
      },
      {
        step: '02',
        title: '补充工作信息',
        desc: '工作区域、年限和备注越清楚，越容易进入联系阶段。'
      },
      {
        step: '03',
        title: '等待平台联系',
        desc: '平台会根据区域和资料完整度安排后续查看与联系。'
      }
    ];

    const readinessItems = computed(() => ([
      {
        label: '基础身份信息',
        done: Boolean(formData.name && formData.phone && formData.id_card),
        text: formData.name && formData.phone && formData.id_card
          ? `${formData.name} · ${formData.phone}`
          : '姓名、手机号和身份证号是进入筛选的基础。'
      },
      {
        label: '工作承接范围',
        done: Boolean(formData.work_area && String(formData.work_years).trim()),
        text: formData.work_area && String(formData.work_years).trim()
          ? `${formData.work_area} · ${formData.work_years}年经验`
          : '工作区域和工作年限会影响平台判断是否匹配当前供给需求。'
      },
      {
        label: '补充说明',
        done: Boolean(formData.notes || formData.address),
        text: formData.notes || formData.address || '补充住址、备注或擅长方向，能减少平台二次追问。'
      }
    ]));

    const completionRate = computed(() => {
      const completed = readinessItems.value.filter((item) => item.done).length;
      return Math.round((completed / readinessItems.value.length) * 100);
    });

    const summaryText = computed(() => {
      const nextItem = readinessItems.value.find((item) => !item.done);
      return nextItem
        ? `当前完成 ${completionRate.value}% ，还可补充：${nextItem.label}`
        : '资料已经比较完整，提交后更适合进入查看和联系阶段';
    });

    const submitJourney = [
      {
        step: '01',
        title: '平台查看资料',
        desc: '会先判断基础信息、区域和年限是否满足当前需求。'
      },
      {
        step: '02',
        title: '进入联系或继续跟进',
        desc: '资料较完整的报名会更容易推进到已查看或已联系状态。'
      },
      {
        step: '03',
        title: '等待后续沟通结果',
        desc: '如果进入联系阶段，平台通常会继续确认到岗意向和服务能力。'
      }
    ];

    const submitButtonText = computed(() => {
      if (isSubmitting.value) {
        return '正在提交...';
      }

      return completionRate.value >= 100 ? '提交申请，等待联系' : '先补齐再提交也可以';
    });
    
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
      heroSteps,
      readinessItems,
      completionRate,
      summaryText,
      submitJourney,
      submitButtonText,
      submitForm
    };
  }
};
</script>

<style scoped>
.job-application-container {
  padding: 24rpx 30rpx 60rpx;
  background:
    radial-gradient(circle at top right, rgba(34, 139, 74, 0.12), transparent 28%),
    #f5f7f6;
  min-height: 100vh;
}

.hero-card,
.summary-card,
.tips-card,
.form-container,
.journey-card {
  border-radius: 24rpx;
  background-color: #fff;
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.06);
}

.hero-card {
  padding: 34rpx 30rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 22%),
    linear-gradient(135deg, #1f6b4c 0%, #2f8f62 56%, #58b879 100%);
  color: #fff;
}

.hero-eyebrow {
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: rgba(255, 255, 255, 0.82);
}

.hero-title {
  display: block;
  margin-top: 14rpx;
  font-size: 42rpx;
  line-height: 1.35;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.84);
}

.hero-steps {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 26rpx;
}

.hero-step {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.14);
}

.hero-step-badge {
  min-width: 64rpx;
  height: 40rpx;
  line-height: 40rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
  font-size: 20rpx;
  text-align: center;
}

.hero-step-copy {
  flex: 1;
}

.hero-step-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
}

.hero-step-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

.summary-card,
.tips-card,
.form-container {
  margin-top: 20rpx;
}

.summary-card {
  padding: 26rpx 30rpx;
}

.summary-title {
  font-size: 22rpx;
  color: #98a2b3;
}

.summary-text {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #344054;
}

.summary-progress {
  height: 14rpx;
  margin-top: 18rpx;
  border-radius: 999rpx;
  background: #edf2f7;
  overflow: hidden;
}

.summary-progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
}

.tips-card {
  padding: 24rpx 30rpx;
}

.tips-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eef2f5;
}

.tips-item:first-child {
  padding-top: 0;
}

.tips-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.tips-badge {
  min-width: 88rpx;
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: #eef2f6;
  font-size: 20rpx;
  text-align: center;
  color: #667085;
}

.tips-badge.done {
  background: #e7f8eb;
  color: #1f8f44;
}

.tips-copy {
  flex: 1;
}

.tips-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #111827;
}

.tips-text {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #667085;
}

.form-container {
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

.journey-card {
  margin: 0 30rpx 10rpx;
  padding: 26rpx 24rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
}

.journey-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.journey-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}

.journey-item {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.journey-step {
  min-width: 64rpx;
  height: 40rpx;
  line-height: 40rpx;
  border-radius: 999rpx;
  background: rgba(31, 143, 68, 0.12);
  font-size: 20rpx;
  text-align: center;
  color: #1f8f44;
}

.journey-copy {
  flex: 1;
}

.journey-item-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #111827;
}

.journey-item-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #667085;
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
