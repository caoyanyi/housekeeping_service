<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">服务筛选</text>
        <text class="hero-title">按家庭需求找到合适的上门服务</text>
        <text class="hero-subtitle">
          支持按分类和关键词筛选，确定服务后可直接进入详情页查看价格、保障和预约说明。
        </text>
      </view>
      <view class="hero-actions">
        <view class="hero-action primary" @click="goAppointmentList">
          <text class="hero-action-title">查看我的预约</text>
          <text class="hero-action-desc">随时跟进状态变化</text>
        </view>
        <view class="hero-action" @click="goUserCenter">
          <text class="hero-action-title">个人中心</text>
          <text class="hero-action-desc">管理资料和设置</text>
        </view>
      </view>
    </view>

    <view class="toolbar">
      <view class="search-box">
        <image src="/static/images/search.svg" mode="aspectFit" class="search-icon"></image>
        <input
          v-model="searchText"
          class="search-input"
          type="text"
          confirm-type="search"
          placeholder="搜索保洁、母婴、维修等服务"
          @input="onSearchInput"
          @confirm="triggerSearch"
        />
        <text v-if="searchText" class="clear-btn" @click="clearSearch">清空</text>
      </view>

      <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
        <view class="category-row">
          <view
            class="category-pill"
            :class="{ active: selectedCategory === 0 }"
            @click="selectCategory(0)"
          >
            全部
          </view>
          <view
            v-for="item in categories"
            :key="item.id"
            class="category-pill"
            :class="{ active: selectedCategory === item.id }"
            @click="selectCategory(item.id)"
          >
            {{ item.name }}
          </view>
        </view>
      </scroll-view>

      <view class="quick-demand-row">
        <text
          v-for="item in quickDemandOptions"
          :key="item.keyword"
          class="quick-demand-pill"
          :class="{ active: searchText === item.keyword }"
          @click="applyQuickDemand(item.keyword)"
        >
          {{ item.label }}
        </text>
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-copy">
        <text class="summary-title">当前筛选结果</text>
        <text class="summary-text">{{ summaryText }}</text>
      </view>
      <text v-if="searchText || selectedCategory !== 0" class="summary-action" @click="resetFilters">
        重置筛选
      </text>
    </view>

    <view class="insight-card">
      <view class="insight-main">
        <text class="insight-title">{{ insightTitle }}</text>
        <text class="insight-text">{{ insightText }}</text>
      </view>
      <view class="insight-metrics">
        <view class="insight-metric">
          <text class="insight-metric-value">{{ total || 0 }}</text>
          <text class="insight-metric-label">筛选结果</text>
        </view>
        <view class="insight-metric">
          <text class="insight-metric-value">{{ services.length }}</text>
          <text class="insight-metric-label">当前已展示</text>
        </view>
      </view>
    </view>

    <view v-if="services.length" class="service-list">
      <view
        v-for="service in services"
        :key="service.id"
        class="service-card"
        @click="goServiceDetail(service.id)"
      >
        <image :src="service.image" mode="aspectFill" class="service-image"></image>
        <view class="service-body">
          <view class="service-head">
            <text class="service-title">{{ service.title }}</text>
            <text class="service-price">¥{{ formatCurrency(service.price) }}</text>
          </view>
          <text class="service-desc">{{ service.plain_description || '暂无服务介绍' }}</text>
          <text class="service-recommend">{{ getServiceRecommendation(service) }}</text>
          <view class="service-tags">
            <text v-for="tag in service.tags.slice(0, 3)" :key="tag" class="service-tag">{{ tag }}</text>
          </view>
          <view class="service-footer">
            <text class="service-duration">{{ service.duration || 60 }}分钟起</text>
            <text class="service-link">查看详情</text>
          </view>
        </view>
      </view>

      <view class="load-state">
        <text v-if="loading">加载中...</text>
        <text v-else-if="hasMore">继续上滑加载更多</text>
        <text v-else>已经到底了</text>
      </view>
    </view>

    <view v-else-if="loading" class="state-block">
      <text class="state-text">服务加载中...</text>
    </view>

    <view v-else class="state-block">
      <image src="/static/images/empty.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-title">{{ emptyTitle }}</text>
      <text class="state-text">{{ emptyText }}</text>
      <view class="state-actions">
        <button class="state-button primary" @click="resetFilters">重新看看</button>
        <button class="state-button ghost" @click="goAppointmentList">查看预约</button>
      </view>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    normalizeService,
    SERVICE_LIST_FILTERS_KEY
} from '../../utils/view-models';

export default {
    data() {
        return {
            searchText: '',
            categories: [],
            services: [],
            selectedCategory: 0,
            page: 1,
            pageSize: 10,
            total: 0,
            hasMore: true,
            loading: false,
            searchTimer: null,
            initialized: false,
            quickDemandOptions: [
                { label: '日常保洁', keyword: '保洁' },
                { label: '深度清洁', keyword: '深度' },
                { label: '母婴护理', keyword: '母婴' },
                { label: '家电清洗', keyword: '清洗' }
            ]
        };
    },
    computed: {
        currentCategoryName() {
            const currentCategory = this.categories.find((item) => item.id === this.selectedCategory);
            return currentCategory?.name || '全部服务';
        },
        summaryText() {
            const categoryText = this.selectedCategory ? `${this.currentCategoryName} · ` : '';
            const searchText = this.searchText ? `“${this.searchText}” · ` : '';
            const countText = this.total ? `共找到 ${this.total} 项服务` : '按服务类型快速筛选';

            return `${categoryText}${searchText}${countText}`;
        },
        firstService() {
            return this.services[0] || null;
        },
        insightTitle() {
            if (this.loading && !this.services.length) {
                return '正在为你整理合适的服务';
            }

            if (!this.total) {
                return this.searchText ? '这个关键词暂时没有匹配结果' : '先从常见需求开始筛选';
            }

            if (this.searchText) {
                return `围绕“${this.searchText}”找到 ${this.total} 项服务`;
            }

            if (this.selectedCategory) {
                return `${this.currentCategoryName} 下有 ${this.total} 项可预约服务`;
            }

            return '可以先看首屏推荐，再决定是否继续细筛';
        },
        insightText() {
            if (!this.total) {
                return this.searchText
                    ? '可以试试更短的关键词，或者先切回分类浏览，再从服务详情页判断是否匹配。'
                    : '如果你还不确定选哪项服务，可以先点常见需求标签，再从价格、时长和说明判断。';
            }

            if (this.firstService) {
                return `如果你想更快做决定，可以先看“${this.firstService.title}”，再根据价格、时长和保障说明继续比较。`;
            }

            return '服务详情页里会补充流程、保障和下单说明，适合做最终判断。';
        },
        emptyTitle() {
            return this.searchText ? '没有找到匹配的服务' : '当前分类暂无服务';
        },
        emptyText() {
            return this.searchText
                ? '可以换一个关键词，或者清空筛选后再试试。'
                : '建议切换分类，看看其他可预约服务。';
        }
    },
    onLoad(options) {
        if (options?.category_id) {
            this.selectedCategory = Number(options.category_id) || 0;
        }

        this.initialized = true;
        this.getCategories();
        this.resetAndFetch();
    },
    onShow() {
        if (!this.initialized) {
            return;
        }

        this.applyStoredFilters();
    },
    onPullDownRefresh() {
        this.resetAndFetch(true);
    },
    onReachBottom() {
        this.loadMore();
    },
    onUnload() {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
    },
    methods: {
        formatCurrency,
        getCategories() {
            this.$request
                .get(API_CONFIG.endpoints.category.getCategories)
                .then((res) => {
                    this.categories = Array.isArray(res.data) ? res.data : [];
                })
                .catch(() => {
                    this.categories = [];
                });
        },
        applyStoredFilters() {
            const stored = uni.getStorageSync(SERVICE_LIST_FILTERS_KEY);
            if (!stored) {
                return;
            }

            uni.removeStorageSync(SERVICE_LIST_FILTERS_KEY);

            const nextCategory = Number(stored.categoryId || 0) || 0;
            const resetSearch = Boolean(stored.resetSearch);
            const nextKeyword = String(stored.keyword || '').trim();
            const shouldRefresh =
                nextCategory !== this.selectedCategory ||
                this.searchText !== nextKeyword ||
                (resetSearch && this.searchText);

            if (!shouldRefresh) {
                return;
            }

            this.selectedCategory = nextCategory;
            this.searchText = resetSearch ? nextKeyword : (nextKeyword || this.searchText);
            this.resetAndFetch();
        },
        fetchServices(stopRefresh = false) {
            if (this.loading) {
                return;
            }

            this.loading = true;

            this.$request
                .get(API_CONFIG.endpoints.service.getServices, {
                    category_id: this.selectedCategory === 0 ? undefined : this.selectedCategory,
                    search: this.searchText.trim(),
                    page: this.page,
                    page_size: this.pageSize
                })
                .then((res) => {
                    const list = (res.data?.list || []).map((item) => normalizeService(item));
                    this.total = Number(res.data?.total || 0);

                    if (this.page === 1) {
                        this.services = list;
                    } else {
                        const existingIds = new Set(this.services.map((item) => item.id));
                        const merged = list.filter((item) => !existingIds.has(item.id));
                        this.services = this.services.concat(merged);
                    }

                    this.hasMore = this.services.length < this.total;
                })
                .catch(() => {
                    if (this.page > 1) {
                        this.page -= 1;
                    }
                    if (this.page === 1) {
                        this.services = [];
                        this.total = 0;
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
            this.fetchServices(stopRefresh);
        },
        selectCategory(categoryId) {
            if (this.selectedCategory === categoryId) {
                return;
            }

            this.selectedCategory = categoryId;
            this.resetAndFetch();
        },
        onSearchInput() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
            }

            this.searchTimer = setTimeout(() => {
                this.resetAndFetch();
            }, 350);
        },
        triggerSearch() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
            }
            this.resetAndFetch();
        },
        clearSearch() {
            this.searchText = '';
            this.resetAndFetch();
        },
        resetFilters() {
            this.searchText = '';
            this.selectedCategory = 0;
            this.resetAndFetch();
        },
        applyQuickDemand(keyword) {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
            }

            this.searchText = keyword;
            this.resetAndFetch();
        },
        loadMore() {
            if (this.loading || !this.hasMore) {
                return;
            }

            this.page += 1;
            this.fetchServices();
        },
        getServiceRecommendation(service) {
            const keywordMap = [
                { keyword: '保洁', text: '适合需要快速恢复日常整洁的家庭场景。' },
                { keyword: '母婴', text: '更适合对护理细节和陪护节奏有明确需求的家庭。' },
                { keyword: '清洗', text: '如果是局部设备或重点区域处理，可以优先看看这类服务。' },
                { keyword: '搬', text: '适合需要一次性处理打包、搬运或整理协助的场景。' }
            ];
            const matched = keywordMap.find((item) => service.title.includes(item.keyword));

            return matched?.text || '建议结合服务说明、时长和备注要求再做最终选择。';
        },
        goServiceDetail(serviceId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.detail, { serviceId });
        },
        goAppointmentList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
        },
        goUserCenter() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.user.profile);
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 14px 16px 88px;
  background:
    radial-gradient(circle at top right, rgba(56, 161, 105, 0.12), transparent 28%),
    #f6f7f9;
}

.hero-card {
  padding: 20px 18px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 24%),
    linear-gradient(135deg, #1c6a49 0%, #2f8f62 55%, #51b574 100%);
  box-shadow: 0 16px 34px rgba(34, 139, 74, 0.2);
  color: #ffffff;
}

.hero-copy {
  display: flex;
  flex-direction: column;
}

.hero-eyebrow {
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: 700;
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
  color: rgba(255, 255, 255, 0.82);
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

.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  margin-top: 16px;
  padding: 14px 14px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.search-box {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  background: #f3f5f7;
}

.search-icon {
  width: 18px;
  height: 18px;
}

.search-input {
  flex: 1;
  margin-left: 10px;
  font-size: 14px;
  color: #111827;
}

.clear-btn {
  font-size: 12px;
  color: #1aad19;
}

.category-scroll {
  margin-top: 12px;
  white-space: nowrap;
}

.quick-demand-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-demand-pill {
  padding: 7px 12px;
  border-radius: 999px;
  background: #edf7ef;
  font-size: 12px;
  color: #267a4c;
}

.quick-demand-pill.active {
  background: #1aad19;
  color: #ffffff;
}

.category-row {
  display: inline-flex;
  padding-right: 14px;
}

.category-pill {
  margin-right: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #f4f6f8;
  font-size: 13px;
  color: #667085;
}

.category-pill.active {
  background: #1aad19;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(26, 173, 25, 0.18);
}

.summary-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 14px 2px 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.summary-copy {
  flex: 1;
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

.summary-action {
  flex-shrink: 0;
  font-size: 13px;
  color: #1aad19;
}

.insight-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin: 0 2px 12px;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbf8 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.insight-main {
  flex: 1;
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

.insight-metrics {
  display: flex;
  gap: 10px;
}

.insight-metric {
  min-width: 68px;
  padding: 10px 8px;
  border-radius: 16px;
  background: #f3f7f4;
  text-align: center;
}

.insight-metric-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.insight-metric-label {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #98a2b3;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.service-card {
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
}

.service-image {
  width: 100%;
  height: 186px;
}

.service-body {
  padding: 16px;
}

.service-head,
.service-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.service-title {
  flex: 1;
  font-size: 17px;
  line-height: 1.4;
  font-weight: 700;
  color: #111827;
}

.service-price {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1aad19;
}

.service-desc {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #6b7280;
}

.service-recommend {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #267a4c;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.service-tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f3f5f7;
  font-size: 12px;
  color: #475467;
}

.service-footer {
  margin-top: 14px;
  align-items: center;
}

.service-duration {
  font-size: 12px;
  color: #98a2b3;
}

.service-link {
  font-size: 13px;
  color: #1aad19;
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
  width: 138px;
  height: 138px;
}

.state-title {
  display: block;
  margin-top: 14px;
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
  flex: 1;
  height: 44px;
  line-height: 44px;
  border-radius: 999px;
  font-size: 14px;
}

.state-button.primary {
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: #ffffff;
}

.state-button.ghost {
  background: #ffffff;
  color: #1aad19;
  border: 1px solid rgba(26, 173, 25, 0.24);
}
</style>
