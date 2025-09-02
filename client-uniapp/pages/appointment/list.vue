<template>
  <view class="container">
    <view class="nav-bar">
      <image src="/static/images/back.png" mode="aspectFit" class="back-icon" @click="goBack"></image>
      <text class="nav-title">我的预约</text>
      <view class="nav-right"></view>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{active: selectedStatus === ''}" @click="selectStatus('')">
        <text>全部</text>
      </view>
      <view class="filter-item" :class="{active: selectedStatus === 'pending'}" @click="selectStatus('pending')">
        <text>待接单</text>
      </view>
      <view class="filter-item" :class="{active: selectedStatus === 'accepted'}" @click="selectStatus('accepted')">
        <text>已接单</text>
      </view>
      <view class="filter-item" :class="{active: selectedStatus === 'completed'}" @click="selectStatus('completed')">
        <text>已完成</text>
      </view>
      <view class="filter-item" :class="{active: selectedStatus === 'cancelled'}" @click="selectStatus('cancelled')">
        <text>已取消</text>
      </view>
    </view>

    <!-- 预约列表 -->
    <view class="appointment-list" v-if="appointments.length > 0">
      <view class="appointment-item" v-for="appointment in appointments" :key="appointment.id">
        <view class="appointment-header">
          <text class="service-title">{{ appointment.service_title }}</text>
          <text class="status" :class="appointment.status">{{ getStatusText(appointment.status) }}</text>
        </view>

        <view class="appointment-info">
          <view class="info-row">
            <text class="info-label">预约时间：</text>
            <text class="info-value">{{ appointment.appointment_date }} {{ appointment.appointment_time }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">服务地址：</text>
            <text class="info-value">{{ appointment.address }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">服务价格：</text>
            <text class="info-value">¥{{ appointment.price }}</text>
          </view>
          <view class="info-row" v-if="appointment.note">
            <text class="info-label">备注信息：</text>
            <text class="info-value">{{ appointment.note }}</text>
          </view>
        </view>

        <view class="appointment-footer">
          <text class="create-time">预约时间：{{ appointment.created_at }}</text>
          <button class="action-button" v-if="canCancel(appointment)" @click="cancelAppointment(appointment.id)">
            取消预约
          </button>
          <button class="detail-button" @click="goAppointmentDetail(appointment.id)">
            查看详情
          </button>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" @click="loadMore" v-if="hasMore">
        <text>上拉加载更多</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-else-if="!loading">
      <image src="/static/images/empty.png" mode="aspectFit" class="empty-icon"></image>
      <text class="empty-text">暂无预约记录</text>
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
    name: 'appointment-list',
    data() {
        return {
            appointments: [],
            selectedStatus: '',
            page: 1,
            pageSize: 10,
            hasMore: true,
            loading: false,
            token: ''
        };
    },
    onLoad() {
        this.token = uni.getStorageSync('token');
        if(!this.token) {
            // 如果没有token，跳转到登录页
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
            return;
        }

        this.getAppointments();
    },
    onPullDownRefresh() {
        // 下拉刷新
        this.page = 1;
        this.hasMore = true;
        this.getAppointments(true);
    },
    onReachBottom() {
        // 上拉加载更多
        if(this.hasMore && !this.loading) {
            this.loadMore();
        }
    },
    methods: {
        getAppointments(refresh = false) {
            this.loading = true;

            const params = {
                page: this.page,
                page_size: this.pageSize
            };

            if(this.selectedStatus) {
                params.status = this.selectedStatus;
            }

            this.$request.get(API_CONFIG.endpoints.appointment.getUserAppointments, params, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    if(refresh) {
                        this.appointments = res.data.list;
                    } else {
                        this.appointments = [...this.appointments, ...res.data.list];
                    }

                    // 判断是否还有更多数据
                    this.hasMore = res.data.list.length === this.pageSize;
                } else {
                    uni.showToast({
                        title: res.msg || '获取预约列表失败',
                        icon: 'none'
                    });
                }

                // 结束下拉刷新
                if(refresh) {
                    uni.stopPullDownRefresh();
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取预约列表失败', err);

                uni.showToast({
                    title: '网络错误，请重试',
                    icon: 'none'
                });

                // 结束下拉刷新
                if(refresh) {
                    uni.stopPullDownRefresh();
                }
            });
        },

        goBack() {
            ROUTER_CONFIG.navigate.back();
        },

        selectStatus(status) {
            this.selectedStatus = status;
            this.page = 1;
            this.hasMore = true;
            this.getAppointments(true);
        },

        getStatusText(status) {
            const statusMap = {
                pending: '待接单',
                accepted: '已接单',
                completed: '已完成',
                cancelled: '已取消'
            };
            return statusMap[status] || status;
        },

        canCancel(appointment) {
            // 只有待接单状态的预约可以取消
            return appointment.status === 'pending';
        },

        cancelAppointment(appointmentId) {
            uni.showModal({
                title: '提示',
                content: '确定要取消此预约吗？',
                success: (modalRes) => {
                    if(modalRes.confirm) {
                        this.loading = true;

                        this.$request.put(`${API_CONFIG.endpoints.appointment.updateAppointmentStatus}/${appointmentId}/status`, {
                            status: 'cancelled'
                        }, {
                            headers: {
                                Authorization: `Bearer ${this.token}`
                            }
                        }).then((response) => {
                            this.loading = false;

                            if(response.code === 200) {
                                uni.showToast({
                                    title: '预约已取消',
                                    icon: 'success'
                                });

                                // 刷新列表
                                this.page = 1;
                                this.getAppointments(true);
                            } else {
                                uni.showToast({
                                    title: response.msg || '取消失败',
                                    icon: 'none'
                                });
                            }
                        }).catch((err) => {
                            this.loading = false;
                            console.error('取消预约失败', err);

                            uni.showToast({
                                title: '网络错误，请重试',
                                icon: 'none'
                            });
                        });
                    }
                }
            });
        },

        goAppointmentDetail(appointmentId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointment.detail, {id: appointmentId});
        },

        loadMore() {
            this.page++;
            this.getAppointments();
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

/* 状态筛选 */
.filter-bar {
    display: flex;
    background-color: white;
    margin-top: 44px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9;
}

.filter-item {
    flex: 1;
    padding: 12px 0;
    text-align: center;
    font-size: 14px;
    color: var(--text-color-secondary);
    border-bottom: 2px solid transparent;
}

.filter-item.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

/* 预约列表 */
.appointment-list {
    margin-top: 90px;
    padding: 10px;
}

.appointment-item {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 10px;
}

.appointment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.service-title {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    flex: 1;
}

.status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
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

.appointment-info {
    margin-bottom: 12px;
}

.info-row {
    display: flex;
    margin-bottom: 8px;
    font-size: 14px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-label {
    color: var(--text-color-secondary);
    min-width: 80px;
}

.info-value {
    flex: 1;
    color: var(--text-color);
}

.appointment-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #eeeeee;
}

.create-time {
    font-size: 12px;
    color: var(--text-color-disabled);
}

.action-button {
    height: 32px;
    background-color: var(--error-color);
    color: white;
    font-size: 12px;
    line-height: 32px;
    border-radius: 16px;
    padding: 0 16px;
}

.detail-button {
    height: 32px;
    background-color: #f5f5f5;
    color: var(--text-color);
    font-size: 12px;
    line-height: 32px;
    border-radius: 16px;
    padding: 0 16px;
}

/* 加载更多 */
.load-more {
    text-align: center;
    padding: 20px;
    color: var(--text-color-secondary);
    font-size: 14px;
}

/* 空状态 */
.empty {
    margin-top: 90px;
    padding: 60px 20px;
    text-align: center;
}

.empty-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 14px;
    color: var(--text-color-disabled);
}

/* 加载状态 */
.loading {
    margin-top: 90px;
    padding: 40px 0;
    text-align: center;
    color: var(--text-color-secondary);
}
</style>
