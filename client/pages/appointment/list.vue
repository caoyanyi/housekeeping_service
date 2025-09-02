<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.png" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">我的预约</text>
      <view class="nav-right"></view>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view class="filter-tab" :class="{ active: activeStatus === '' }" @click="switchStatus('')">全部</view>
        <view class="filter-tab" :class="{ active: activeStatus === 'pending' }" @click="switchStatus('pending')">待确认</view>
        <view class="filter-tab" :class="{ active: activeStatus === 'confirmed' }" @click="switchStatus('confirmed')">已确认</view>
        <view class="filter-tab" :class="{ active: activeStatus === 'completed' }" @click="switchStatus('completed')">已完成</view>
        <view class="filter-tab" :class="{ active: activeStatus === 'canceled' }" @click="switchStatus('canceled')">已取消</view>
      </view>
    </view>

    <!-- 预约列表 -->
    <scroll-view class="list-container" scroll-y @scrolltolower="loadMore" @refresherrefresh="refresh">
      <view class="list-item" v-for="appointment in appointmentList" :key="appointment.id" @click="goToDetail(appointment.id)">
        <view class="list-item-header">
          <text class="appointment-code">订单编号：{{ appointment.code }}</text>
          <text class="appointment-status" :class="`status-${appointment.status}`">{{ getStatusText(appointment.status) }}</text>
        </view>
        
        <view class="service-info">
          <image :src="appointment.service.image" mode="aspectFit" class="service-image"></image>
          <view class="service-details">
            <text class="service-name">{{ appointment.service.name }}</text>
            <text class="service-price">¥{{ appointment.service.price.toFixed(2) }}</text>
            <text class="appointment-time">预约时间：{{ appointment.appointment_date }} {{ appointment.appointment_time }}</text>
          </view>
        </view>
        
        <view class="list-item-footer">
          <text class="technician-name">{{ appointment.technician ? `技师：${appointment.technician.name}` : '-' }}</text>
          <image src="/static/images/arrow_right.png" mode="aspectFit" class="arrow-icon"></image>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="appointmentList.length === 0 && !loading">
        <image src="/static/images/empty.png" mode="aspectFit" class="empty-image"></image>
        <text class="empty-text">暂无预约记录</text>
        <button class="empty-button" @click="goToServiceList">立即预约</button>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="appointmentList.length > 0 && !loading">
        <text class="load-more-text">{{ hasMore ? '上拉加载更多' : '没有更多了' }}</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading" v-if="loading">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
// 引入API配置
import API_CONFIG from '../../config/api.config';
// 引入路由配置
import ROUTER_CONFIG from '../../config/router.config';

export default {
    name: 'appointment-list',
    data() {
        return {
            activeStatus: '', // 空字符串表示全部状态
            appointmentList: [],
            page: 1,
            pageSize: 10,
            hasMore: true,
            loading: false,
            token: ''
        };
    },
    onLoad() {
        this.token = uni.getStorageSync('token');
        this.getAppointmentList();
    },
    methods: {
        getAppointmentList() {
            // 如果已经没有更多数据，则不再请求
            if(!this.hasMore && this.page > 1) {
                return;
            }

            this.loading = true;

            const params = {
                page: this.page,
                page_size: this.pageSize
            };

            // 如果有选中的状态，则添加状态筛选条件
            if(this.activeStatus) {
                params.status = this.activeStatus;
            }

            this.$request.get(API_CONFIG.endpoints.appointment.getAppointment, params, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    const data = res.data || {};
                    const list = data.list || [];

                    // 如果是第一页，则替换列表，否则追加列表
                    if(this.page === 1) {
                        this.appointmentList = list;
                    } else {
                        this.appointmentList = [...this.appointmentList, ...list];
                    }

                    // 判断是否还有更多数据
                    this.hasMore = list.length === this.pageSize;
                } else {
                    uni.showToast({
                        title: res.msg || '获取预约列表失败',
                        icon: 'none'
                    });
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取预约列表失败', err);
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

        switchStatus(status) {
            // 如果点击的是当前激活的状态，则不做任何操作
            if(this.activeStatus === status) {
                return;
            }

            // 切换状态
            this.activeStatus = status;
            // 重置页码
            this.page = 1;
            // 重置是否有更多数据的标记
            this.hasMore = true;
            // 重新获取列表
            this.getAppointmentList();
        },

        goToDetail(appointmentId) {
            ROUTER_CONFIG.navigate.to({
                url: `${ROUTER_CONFIG.pages.appointmentDetail}?appointmentId=${appointmentId}`
            });
        },

        goToServiceList() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.serviceList);
        },

        goBack() {
            ROUTER_CONFIG.navigate.back();
        },

        refresh() {
            // 重置页码
            this.page = 1;
            // 重置是否有更多数据的标记
            this.hasMore = true;
            // 重新获取列表
            this.getAppointmentList();
        },

        loadMore() {
            // 如果正在加载中，或者没有更多数据，则不进行操作
            if(this.loading || !this.hasMore) {
                return;
            }

            // 增加页码
            this.page++;
            // 获取更多数据
            this.getAppointmentList();
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

/* 筛选区域 */
.filter-section {
  margin-top: 44px;
  background-color: white;
  border-bottom: 1px solid #eeeeee;
}

.filter-tabs {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 16px;
}

.filter-tab {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.filter-tab.active {
  color: var(--primary-color);
  font-weight: bold;
}

/* 列表容器 */
.list-container {
  flex: 1;
  height: calc(100vh - 44px - 48px);
}

/* 列表项 */
.list-item {
  margin: 10px 16px;
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.appointment-code {
  font-size: 12px;
  color: var(--text-color-disabled);
}

.appointment-status {
  font-size: 14px;
  font-weight: bold;
}

.status-pending {
  color: #fa8c16;
}

.status-confirmed {
  color: #1890ff;
}

.status-canceled {
  color: #8c8c8c;
}

.status-completed {
  color: #52c41a;
}

.status-no_show {
  color: #f5222d;
}

/* 服务信息 */
.service-info {
  display: flex;
  margin-bottom: 12px;
}

.service-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  margin-right: 12px;
}

.service-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.service-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 4px;
  display: block;
}

.service-price {
  font-size: 14px;
  color: var(--danger-color);
  margin-bottom: 4px;
  display: block;
}

.appointment-time {
  font-size: 12px;
  color: var(--text-color-secondary);
  display: block;
}

/* 列表项底部 */
.list-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.technician-name {
  font-size: 12px;
  color: var(--text-color-secondary);
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.empty-image {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-color-disabled);
  margin-bottom: 16px;
}

.empty-button {
  width: 120px;
  height: 40px;
  background-color: var(--primary-color);
  color: white;
  font-size: 14px;
  border-radius: 20px;
  padding: 0;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 16px;
}

.load-more-text {
  font-size: 12px;
  color: var(--text-color-disabled);
}

/* 加载状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
</style>