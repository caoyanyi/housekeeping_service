<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">预约中心</text>
        <text class="hero-title">在这里跟进每一笔预约的处理进度</text>
        <text class="hero-subtitle">
          待接单、已接单、已完成和已取消状态都会同步展示，方便随时查看服务安排。
        </text>
      </view>
      <view class="hero-actions">
        <view class="hero-action primary" @click="goToServiceList">
          <text class="hero-action-title">继续预约服务</text>
          <text class="hero-action-desc">返回服务列表挑选项目</text>
        </view>
        <view class="hero-action" @click="goUserCenter">
          <text class="hero-action-title">个人中心</text>
          <text class="hero-action-desc">管理资料和账号设置</text>
        </view>
      </view>
    </view>

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

    <view class="summary-card">
      <view class="summary-copy">
        <text class="summary-title">当前视图</text>
        <text class="summary-text">{{ summaryText }}</text>
      </view>
    </view>

    <view v-if="token" class="metric-grid">
      <view v-for="item in overviewCards" :key="item.label" class="metric-card">
        <text class="metric-value">{{ item.value }}</text>
        <text class="metric-label">{{ item.label }}</text>
      </view>
    </view>

    <view v-if="token" class="insight-card">
      <text class="insight-title">{{ insightTitle }}</text>
      <text class="insight-text">{{ insightText }}</text>
    </view>

    <view v-if="!token" class="state-block">
      <image src="/static/images/avatar.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-title">登录后查看预约记录</text>
      <text class="state-text">预约进度、时间和地址都会在这里同步展示。</text>
      <button class="state-button primary" @click="goLogin">去登录</button>
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
          <view class="footer-copy">
            <text class="service-price">¥{{ formatCurrency(appointment.service_price) }}</text>
            <text class="footer-note">{{ footerNote(appointment.status) }}</text>
          </view>
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
      <view class="state-actions">
        <button class="state-button primary" @click="goToServiceList">立即预约</button>
        <button class="state-button ghost" @click="goUserCenter">查看个人中心</button>
      </view>
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
                { label: '已取消', value: 'cancelled' },
                { label: '已拒绝', value: 'rejected' },
                { label: '未履约', value: 'no_show' }
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
        currentStatusLabel() {
            const currentTab = this.statusTabs.find((item) => item.value === this.activeStatus);
            return currentTab?.label || '全部';
        },
        summaryText() {
            return `当前查看：${this.currentStatusLabel}${this.total ? ` · 共 ${this.total} 条预约` : ''}`;
        },
        overviewCards() {
            const loadedCount = this.appointmentList.length;
            const followUpCount = this.appointmentList.filter((item) =>
                ['pending', 'accepted'].includes(item.status)
            ).length;

            return [
                {
                    label: '筛选结果',
                    value: this.total || 0
                },
                {
                    label: '已加载',
                    value: this.total ? `${loadedCount}/${this.total}` : loadedCount
                },
                {
                    label: '已加载待跟进',
                    value: followUpCount
                },
                {
                    label: '当前视图',
                    value: this.currentStatusLabel
                }
            ];
        },
        insightTitle() {
            if (!this.total) {
                return '当前没有需要处理的预约';
            }

            if (this.activeStatus === 'pending') {
                return '这批预约正等待平台确认';
            }

            if (this.activeStatus === 'accepted') {
                return '这批预约已进入服务准备阶段';
            }

            if (this.activeStatus === 'completed') {
                return '这些预约已经完成履约';
            }

            if (this.activeStatus === 'cancelled') {
                return '这些预约已经结束或取消';
            }

            if (this.activeStatus === 'rejected') {
                return '这些预约未被平台受理';
            }

            if (this.activeStatus === 'no_show') {
                return '这些预约未能按预期完成履约';
            }

            return '建议优先关注待接单和已接单预约';
        },
        insightText() {
            if (!this.total) {
                return '可以回到服务列表继续预约，新的预约记录会自动同步到这里。';
            }

            if (this.activeStatus === 'pending') {
                return '如果预约时间临近但仍未确认，建议留意平台联系，并提前确保联系电话畅通。';
            }

            if (this.activeStatus === 'accepted') {
                return '已接单预约通常只差最终上门执行，建议再次确认地址、时间和备注信息是否准确。';
            }

            if (this.activeStatus === 'completed') {
                return '如需再次预约同类服务，可以进入详情页快速查看原订单信息并重新下单。';
            }

            if (this.activeStatus === 'cancelled') {
                return '取消后的订单不会继续处理，如果仍有需求，建议重新预约并补充更完整的时间和地址。';
            }

            if (this.activeStatus === 'rejected') {
                return '如果预约被拒绝，通常需要重新确认需求、时间或地址信息后再提交。';
            }

            if (this.activeStatus === 'no_show') {
                return '未履约通常意味着订单未按计划完成，建议进入详情页查看记录并决定是否重新预约。';
            }

            return '待接单表示平台正在确认安排，已接单表示服务准备中，进入详情页可以查看更完整的信息。';
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

        const needRefresh = uni.getStorageSync('appointmentListNeedRefresh');
        if (needRefresh) {
            uni.removeStorageSync('appointmentListNeedRefresh');
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
        footerNote(status) {
            const noteMap = {
                pending: '等待平台确认服务安排',
                accepted: '服务已进入准备阶段',
                completed: '服务已完成，可回看详情',
                cancelled: '订单已取消，可重新预约',
                rejected: '订单未受理，可重新提交需求',
                no_show: '订单未按计划履约，可查看详情'
            };

            return noteMap[status] || '查看详细进度';
        },
        goToDetail(appointmentId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointment.detail, { appointmentId });
        },
        goToServiceList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goUserCenter() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.user.profile);
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
  background:
    radial-gradient(circle at top left, rgba(47, 124, 194, 0.12), transparent 30%),
    #f6f7f9;
}

.hero-card {
  padding: 20px 18px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 24%),
    linear-gradient(135deg, #1d5f8b 0%, #2f7cc2 52%, #59a8d6 100%);
  box-shadow: 0 18px 36px rgba(47, 124, 194, 0.2);
  color: #ffffff;
}

.hero-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.8);
}

.hero-title {
  display: block;
  margin-top: 10px;
  font-size: 23px;
  line-height: 1.35;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.84);
}

.hero-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.hero-action {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
}

.hero-action.primary {
  background: rgba(255, 255, 255, 0.22);
}

.hero-action-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.hero-action-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.tab-scroll {
  margin-top: 16px;
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
  background: #1d79c2;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(47, 124, 194, 0.22);
}

.summary-card {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.summary-title {
  display: block;
  font-size: 12px;
  color: #98a2b3;
}

.summary-text {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #475467;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.metric-card {
  padding: 14px 10px;
  border-radius: 18px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.metric-label {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #98a2b3;
}

.insight-card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.insight-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.insight-text {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #667085;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.appointment-card {
  padding: 14px;
  border-radius: 22px;
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

.status-rejected {
  background: #fff1f3;
  color: #c01048;
}

.status-no_show {
  background: #fff4eb;
  color: #b54708;
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
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.service-time,
.service-address {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #667085;
}

.card-footer {
  margin-top: 14px;
}

.footer-copy {
  display: flex;
  flex-direction: column;
}

.service-price {
  font-size: 17px;
  font-weight: 700;
  color: #1d79c2;
}

.footer-note {
  margin-top: 5px;
  font-size: 12px;
  color: #98a2b3;
}

.detail-link {
  font-size: 13px;
  color: #1d79c2;
}

.load-state {
  padding: 18px 0 4px;
  text-align: center;
  font-size: 13px;
  color: #98a2b3;
}

.state-block {
  padding: 56px 24px;
  text-align: center;
}

.state-image {
  width: 136px;
  height: 136px;
}

.state-title {
  display: block;
  margin-top: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.state-text {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #98a2b3;
}

.state-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.state-button {
  min-width: 120px;
  height: 44px;
  line-height: 44px;
  border-radius: 999px;
  font-size: 14px;
}

.state-button.primary {
  background: linear-gradient(135deg, #1d79c2 0%, #48a7df 100%);
  color: #ffffff;
}

.state-button.ghost {
  background: #ffffff;
  color: #1d79c2;
  border: 1px solid rgba(47, 124, 194, 0.22);
}
</style>
