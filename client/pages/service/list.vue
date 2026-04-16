<template>
  <view class="page">
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
    </view>

    <view class="summary-row">
      <text class="summary-text">{{ summaryText }}</text>
      <text v-if="searchText || selectedCategory !== 0" class="summary-action" @click="resetFilters">
        重置筛选
      </text>
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
      <button class="state-button" @click="resetFilters">重新看看</button>
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
            initialized: false
        };
    },
    computed: {
        summaryText() {
            const currentCategory = this.categories.find((item) => item.id === this.selectedCategory);
            const categoryText = currentCategory ? `${currentCategory.name} · ` : '';
            const searchText = this.searchText ? `“${this.searchText}” · ` : '';
            const countText = this.total ? `共找到 ${this.total} 项服务` : '按服务类型快速筛选';

            return `${categoryText}${searchText}${countText}`;
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
            const shouldRefresh =
                nextCategory !== this.selectedCategory || (resetSearch && this.searchText);

            if (!shouldRefresh) {
                return;
            }

            this.selectedCategory = nextCategory;
            if (resetSearch) {
                this.searchText = '';
            }
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
        loadMore() {
            if (this.loading || !this.hasMore) {
                return;
            }

            this.page += 1;
            this.fetchServices();
        },
        goServiceDetail(serviceId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.detail, { serviceId });
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 14px 16px 88px;
  background: #f6f7f9;
}

.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
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
  height: 100%;
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

.category-row {
  display: inline-flex;
  padding-right: 16px;
}

.category-pill {
  margin-right: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
}

.category-pill.active {
  background: #1aad19;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(26, 173, 25, 0.22);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 2px 12px;
}

.summary-text {
  flex: 1;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.summary-action {
  margin-left: 12px;
  font-size: 13px;
  color: #1aad19;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-card {
  display: flex;
  padding: 12px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.service-image {
  width: 112px;
  height: 112px;
  border-radius: 16px;
  background: #eef2f7;
}

.service-body {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.service-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.service-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.service-price {
  font-size: 16px;
  font-weight: 700;
  color: #1aad19;
}

.service-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.service-tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef8ef;
  font-size: 11px;
  color: #26803d;
}

.service-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
}

.service-duration {
  font-size: 12px;
  color: #9ca3af;
}

.service-link {
  font-size: 12px;
  color: #1aad19;
}

.load-state,
.state-block {
  text-align: center;
}

.load-state {
  padding: 18px 0 6px;
  font-size: 12px;
  color: #9ca3af;
}

.state-block {
  margin-top: 70px;
  padding: 0 24px;
}

.state-image {
  width: 132px;
  height: 132px;
  opacity: 0.9;
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
  color: #9ca3af;
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
