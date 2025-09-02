<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.svg" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">预约详情</text>
      <view class="nav-right"></view>
    </view>

    <!-- 预约状态 -->
    <view class="status-section" :class="`status-${appointmentInfo?.status}`">
      <text class="status-text">{{ getStatusText(appointmentInfo?.status) }}</text>
    </view>

    <!-- 预约信息 -->
    <view class="info-section">
      <text class="section-title">预约信息</text>
      
      <view class="info-item">
        <text class="info-label">预约编号</text>
        <text class="info-value">{{ appointmentInfo?.code }}</text>
      </view>

      <view class="info-item">
        <text class="info-label">预约日期</text>
        <text class="info-value">{{ appointmentInfo?.appointment_date }}</text>
      </view>

      <view class="info-item">
        <text class="info-label">预约时间</text>
        <text class="info-value">{{ appointmentInfo?.appointment_time }}</text>
      </view>

      <view class="info-item">
        <text class="info-label">预约人</text>
        <text class="info-value">{{ appointmentInfo?.user_name }}</text>
      </view>

      <view class="info-item">
        <text class="info-label">联系电话</text>
        <text class="info-value">{{ appointmentInfo?.phone }}</text>
        <image src="/static/images/phone.svg" mode="aspectFit" class="phone-icon" @click="makePhoneCall"></image>
      </view>
    </view>

    <!-- 服务信息 -->
    <view class="service-section" v-if="appointmentInfo?.service">
      <text class="section-title">服务信息</text>
      
      <view class="service-item">
        <image :src="appointmentInfo.service.image" mode="aspectFit" class="service-image"></image>
        <view class="service-details">
          <text class="service-name">{{ appointmentInfo.service.name }}</text>
          <text class="service-price">¥{{ appointmentInfo.service.price.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 技师信息 -->
    <view class="technician-section" v-if="appointmentInfo?.technician">
      <text class="section-title">技师信息</text>
      
      <view class="technician-item">
        <image :src="appointmentInfo.technician.avatar" mode="aspectFit" class="technician-avatar"></image>
        <view class="technician-details">
          <text class="technician-name">{{ appointmentInfo.technician.name }}</text>
          <text class="technician-level">{{ appointmentInfo.technician.level }}</text>
        </view>
      </view>
    </view>

    <!-- 备注信息 -->
    <view class="remark-section" v-if="appointmentInfo?.remark">
      <text class="section-title">备注信息</text>
      <text class="remark-text">{{ appointmentInfo.remark }}</text>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons" v-if="showCancelButton">
      <button class="cancel-button" @click="showCancelConfirm">取消预约</button>
    </view>

    <!-- 取消预约确认弹窗 -->
    <view class="dialog" v-if="showCancelDialog">
      <view class="dialog-content">
        <text class="dialog-title">取消预约</text>
        <text class="dialog-message">确定要取消此预约吗？取消后无法恢复。</text>
        <view class="dialog-buttons">
          <button class="cancel-dialog-button" @click="cancelCancel">取消</button>
          <button class="confirm-dialog-button" @click="confirmCancel">确定</button>
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
    name: 'appointment-detail',
    data() {
        return {
            appointmentId: '',
            appointmentInfo: null,
            token: '',
            loading: false,
            showCancelDialog: false
        };
    },
    onLoad(options) {
        if(options.appointmentId) {
            this.appointmentId = options.appointmentId;
            this.token = uni.getStorageSync('token');
            this.getAppointmentDetail();
        }
    },
    computed: {
        showCancelButton() {
            // 只有待确认和已确认的预约可以取消
            return this.appointmentInfo && ['pending', 'confirmed'].includes(this.appointmentInfo.status);
        }
    },
    methods: {
        getAppointmentDetail() {
            this.loading = true;

            this.$request.get(`${API_CONFIG.endpoints.appointment.getAppointment}/${this.appointmentId}`, {}, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    this.appointmentInfo = res.data;
                } else {
                    uni.showToast({
                        title: res.msg || '获取预约详情失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取预约详情失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
            });
        },

        getStatusText(status) {
            const statusMap = {
                'pending': '待确认',
                'confirmed': '已确认',
                'canceled': '已取消',
                'completed': '已完成',
                'no_show': '未履约'
            };
            return statusMap[status] || '未知状态';
        },

        makePhoneCall() {
            if(this.appointmentInfo?.phone) {
                uni.makePhoneCall({
                    phoneNumber: this.appointmentInfo.phone
                });
            }
        },

        showCancelConfirm() {
            this.showCancelDialog = true;
        },

        cancelCancel() {
            this.showCancelDialog = false;
        },

        confirmCancel() {
      this.loading = true;
      this.showCancelDialog = false;

      this.$request.put(`${API_CONFIG.endpoints.appointment.updateAppointmentStatus}/${this.appointmentId}`, {
        status: 'canceled'
      }, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      }).then((res) => {
        this.loading = false;

        if(res.code === 200) {
          uni.showToast({
            title: '预约已取消',
            icon: 'success'
          });

          // 更新预约状态
          this.appointmentInfo.status = 'canceled';

          // 延迟返回上一页
          setTimeout(() => {
            ROUTER_CONFIG.navigate.back();
          }, 1500);
        } else {
          uni.showToast({
            title: res.msg || '取消预约失败',
            icon: 'none'
          });
        }
            }).catch((err) => {
                this.loading = false;
                this.showCancelDialog = false;
                console.error('取消预约失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });
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

/* 状态区域 */
.status-section {
  margin-top: 44px;
  padding: 16px;
  text-align: center;
}

.status-pending {
  background-color: #fff9e6;
}

.status-confirmed {
  background-color: #e6f7ff;
}

.status-canceled {
  background-color: #f5f5f5;
}

.status-completed {
  background-color: #f6ffed;
}

.status-no_show {
  background-color: #fff2f0;
}

.status-text {
  font-size: 16px;
  font-weight: bold;
}

.status-pending .status-text {
  color: #fa8c16;
}

.status-confirmed .status-text {
  color: #1890ff;
}

.status-canceled .status-text {
  color: #8c8c8c;
}

.status-completed .status-text {
  color: #52c41a;
}

.status-no_show .status-text {
  color: #f5222d;
}

/* 信息区域 */
.info-section,
.service-section,
.technician-section,
.remark-section {
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

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eeeeee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--text-color-secondary);
  width: 100px;
}

.info-value {
  font-size: 14px;
  color: var(--text-color);
  flex: 1;
}

.phone-icon {
  width: 20px;
  height: 20px;
  margin-left: 16px;
}

/* 服务信息 */
.service-item {
  display: flex;
  align-items: center;
}

.service-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  margin-right: 16px;
}

.service-details {
  flex: 1;
}

.service-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.service-price {
  font-size: 16px;
  color: var(--danger-color);
}

/* 技师信息 */
.technician-item {
  display: flex;
  align-items: center;
}

.technician-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 16px;
}

.technician-details {
  flex: 1;
}

.technician-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  display: block;
  margin-bottom: 8px;
}

.technician-level {
  font-size: 14px;
  color: var(--text-color-secondary);
}

/* 备注信息 */
.remark-text {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.5;
}

/* 操作按钮 */
.action-buttons {
  margin: 20px 16px;
}

.cancel-button {
  width: 100%;
  height: 48px;
  background-color: #f5f5f5;
  color: var(--text-color);
  font-size: 16px;
  border-radius: 24px;
  padding: 0;
}

/* 弹窗 */
.dialog {
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

.dialog-content {
  width: 80%;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
}

.dialog-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 16px;
}

.dialog-message {
  display: block;
  font-size: 14px;
  color: var(--text-color-secondary);
  text-align: center;
  line-height: 1.5;
  margin-bottom: 20px;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
}

.cancel-dialog-button {
  flex: 1;
  height: 44px;
  background-color: #f5f5f5;
  color: var(--text-color);
  margin-right: 8px;
  border-radius: 8px;
  font-size: 16px;
  padding: 0;
}

.confirm-dialog-button {
  flex: 1;
  height: 44px;
  background-color: var(--danger-color);
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