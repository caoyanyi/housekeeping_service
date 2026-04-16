<template>
  <view class="page">
    <scroll-view scroll-x class="tab-scroll" show-scrollbar="false">
      <view class="tab-row">
        <view
          v-for="tab in statusTabs"
          :key="tab.value || 'all'"
          class="tab-item"
          :class="{ active: activeStatus === tab.value }"
          @click="switchStatus(tab.value)"
        >
          {{ tab.label }}
        </view>
      </view>
    </scroll-view>

    <view class="summary-row">
      <text class="summary-text">{{ summaryText }}</text>
    </view>

    <view v-if="!token" class="state-block">
      <image src="/static/images/avatar.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-title">登录后查看预约记录</text>
      <text class="state-text">预约进度、时间和地址都会在这里同步展示。</text>
      <button class="state-button" @click="goLogin">去登录</button>
    </view>

    <view v-else-if="appointmentList.length" class="appointment-list">
      <view
        v-for="appointment in appointmentList"
        :key="appointment.id"
        class="appointment-card"
        @click="goToDetail(appointment.id)"
      >
        <view class="card-header">
          <text class="order-no">订单号 #{{ appointment.id }}</text>
          <text class="status-pill" :class="`status-${appointment.status}`">{{ appointment.status_text }}</text>
        </view>

        <view class="card-main">
          <image :src="appointment.service_image" mode="aspectFill" class="service-image"></image>
          <view class="card-content">
            <text class="service-title">{{ appointment.service_title }}</text>
            <text class="service-time">{{ appointment.appointment_datetime }}</text>
            <text class="service-address">{{ appointment.address }}</text>
          </view>
        </view>

        <view class="card-footer">
          <text class="service-price">¥{{ formatCurrency(appointment.service_price) }}</text>
          <text class="detail-link">查看详情</text>
        </view>
      </view>

      <view class="load-state">
        <text v-if="loading">加载中...</text>
        <text v-else-if="hasMore">继续上滑加载更多</text>
        <text v-else>已经到底了</text>
      </view>
    </view>

    <view v-else-if="loading" class="state-block">
      <text class="state-text">预约列表加载中...</text>
    </view>

    <view v-else class="state-block">
      <image src="/static/images/empty.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-title">还没有预约记录</text>
      <text class="state-text">去看看合适的服务，预约后会在这里展示。</text>
      <button class="state-button" @click="goToServiceList">立即预约</button>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    normalizeAppointment
} from '../../utils/view-models';

export default {
    data() {
        return {
            statusTabs: [
                { label: '全部', value: '' },
                { label: '待接单', value: 'pending' },
                { label: '已接单', value: 'accepted' },
                { label: '已完成', value: 'completed' },
                { label: '已取消', value: 'cancelled' }
            ],
            activeStatus: '',
            appointmentList: [],
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: true,
            loading: false,
            token: ''
        };
    },
    computed: {
        summaryText() {
            const currentTab = this.statusTabs.find((item) => item.value === this.activeStatus);
            const label = currentTab?.label || '全部';
            return `当前查看：${label}${this.total ? ` · 共 ${this.total} 条预约` : ''}`;
        }
    },
    onShow() {
        this.token = uni.getStorageSync('token');
        if (!this.token) {
            this.appointmentList = [];
            this.total = 0;
            this.loading = false;
            return;
        }

        this.resetAndFetch();
    },
    onPullDownRefresh() {
        if (!this.token) {
            uni.stopPullDownRefresh();
            return;
        }
        this.resetAndFetch(true);
    },
    onReachBottom() {
        this.loadMore();
    },
    methods: {
        formatCurrency,
        fetchAppointments(stopRefresh = false) {
            if (this.loading || !this.token) {
                return;
            }

            this.loading = true;

            this.$request
                .get(
                    API_CONFIG.endpoints.appointment.getAppointment,
                    {
                        page: this.page,
                        page_size: this.pageSize,
                        status: this.activeStatus || undefined
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.token}`
                        }
                    }
                )
                .then((res) => {
                    const list = (res.data?.list || []).map((item) => normalizeAppointment(item));
                    this.total = Number(res.data?.total || 0);

                    if (this.page === 1) {
                        this.appointmentList = list;
                    } else {
                        this.appointmentList = this.appointmentList.concat(list);
                    }

                    this.hasMore = this.appointmentList.length < this.total;
                })
                .catch(() => {
                    if (this.page > 1) {
                        this.page -= 1;
                    }
                })
                .finally(() => {
                    this.loading = false;
                    if (stopRefresh) {
                        uni.stopPullDownRefresh();
                    }
                });
        },
        resetAndFetch(stopRefresh = false) {
            this.page = 1;
            this.total = 0;
            this.hasMore = true;
            this.fetchAppointments(stopRefresh);
        },
        switchStatus(status) {
            if (this.activeStatus === status) {
                return;
            }

            this.activeStatus = status;
            this.resetAndFetch();
        },
        loadMore() {
            if (!this.token || this.loading || !this.hasMore) {
                return;
            }

            this.page += 1;
            this.fetchAppointments();
        },
        goToDetail(appointmentId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointment.detail, { appointmentId });
        },
        goToServiceList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goLogin() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 84px;
  background: #f6f7f9;
}

.tab-scroll {
  white-space: nowrap;
}

.tab-row {
  display: inline-flex;
  padding-right: 16px;
}

.tab-item {
  margin-right: 10px;
  padding: 9px 15px;
  border-radius: 999px;
  background: #ffffff;
  font-size: 13px;
  color: #6b7280;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.tab-item.active {
  background: #1aad19;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(26, 173, 25, 0.2);
}

.summary-row {
  margin: 14px 4px 12px;
}

.summary-text {
  font-size: 13px;
  color: #6b7280;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appointment-card {
  padding: 14px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.card-header,
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-no {
  font-size: 12px;
  color: #98a2b3;
}

.status-pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
}

.status-pending {
  background: #fff7e6;
  color: #d48806;
}

.status-accepted {
  background: #ecfdf3;
  color: #027a48;
}

.status-completed {
  background: #eef4ff;
  color: #175cd3;
}

.status-cancelled {
  background: #f2f4f7;
  color: #667085;
}

.card-main {
  display: flex;
  margin-top: 14px;
}

.service-image {
  width: 76px;
  height: 76px;
  border-radius: 16px;
  background: #eef2f7;
}

.card-content {
  flex: 1;
  margin-left: 12px;
}

.service-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.service-time,
.service-address {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.card-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f2f4f7;
}

.service-price {
  font-size: 16px;
  font-weight: 700;
  color: #1aad19;
}

.detail-link {
  font-size: 12px;
  color: #1aad19;
}

.load-state {
  padding: 18px 0 6px;
  text-align: center;
  font-size: 12px;
  color: #98a2b3;
}

.state-block {
  margin-top: 72px;
  text-align: center;
  padding: 0 28px;
}

.state-image {
  width: 132px;
  height: 132px;
}

.state-title {
  display: block;
  margin-top: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.state-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #98a2b3;
}

.state-button {
  width: 180px;
  height: 42px;
  margin-top: 18px;
  border-radius: 999px;
  background: #1aad19;
  color: #ffffff;
  font-size: 15px;
}
</style>
