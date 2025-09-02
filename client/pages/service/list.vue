<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <image src="/static/images/search.svg" mode="aspectFit" class="search-icon"></image>
        <input type="text" placeholder="搜索服务" v-model="searchText" @input="onSearchInput" class="input" />
      </view>
    </view>

    <!-- 分类筛选 -->
    <view class="filter-bar">
      <scroll-view scroll-x class="category-scroll">
        <view class="category-item" :class="{active: selectedCategory === 0}" @click="selectCategory(0)">
          <text>全部</text>
        </view>
        <view class="category-item" :class="{active: selectedCategory === item.id}" v-for="item in categories" :key="item.id" @click="selectCategory(item.id)">
          <text>{{ item.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 服务列表 -->
    <view class="service-list" v-if="services.length > 0">
      <view class="service-item" v-for="service in services" :key="service.id" @click="goServiceDetail(service.id)">
        <image :src="service.image_urls[0]" mode="aspectFill" class="service-image"></image>
        <view class="service-info">
          <text class="service-title">{{ service.title }}</text>
          <text class="service-description">{{ service.description }}</text>
          <view class="service-footer">
            <text class="service-price">¥{{ service.price }}</text>
            <text class="service-duration">{{ service.duration }}分钟</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" @click="loadMore" v-if="hasMore">
        <text>上拉加载更多</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-else-if="!loading">
      <image src="/static/images/empty.svg" mode="aspectFit" class="empty-icon"></image>
      <text class="empty-text">暂无服务</text>
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
    data() {
        return {
            searchText: '',
            categories: [],
            services: [],
            selectedCategory: 0,
            page: 1,
            pageSize: 10,
            hasMore: true,
            loading: false,
            searchTimer: null
        };
    },
    onLoad(options) {
        // 检查是否有传入分类ID
        if(options && options.category_id) {
            this.selectedCategory = parseInt(options.category_id, 10);
        }

        // 获取分类列表
        this.getCategories();

        // 获取服务列表
        this.getServices();
    },
    onPullDownRefresh() {
        // 下拉刷新
        this.page = 1;
        this.hasMore = true;
        this.getServices(true);
    },
    onReachBottom() {
        // 上拉加载更多
        if(this.hasMore && !this.loading) {
            this.loadMore();
        }
    },
    methods: {
        getCategories() {
            this.$request.get(API_CONFIG.endpoints.category.getCategories).then((res) => {
                if(res.code === 200) {
                    this.categories = res.data;
                }
            }).catch((err) => {
                console.error('获取分类失败', err);
            });
        },

        getServices(refresh = false) {
            this.loading = true;

            this.$request.get(API_CONFIG.endpoints.service.getServices, {
                category_id: this.selectedCategory === 0 ? null : this.selectedCategory,
                search: this.searchText,
                page: this.page,
                page_size: this.pageSize
            }).then((res) => {
                this.loading = false;

                if(res.code === 200) {
                    if(refresh) {
                        this.services = res.data.list;
                    } else {
                        this.services = [...this.services, ...res.data.list];
                    }

                    // 判断是否还有更多数据
                    this.hasMore = res.data.list.length === this.pageSize;
                }

                // 结束下拉刷新
                if(refresh) {
                    uni.stopPullDownRefresh();
                }
            }).catch((err) => {
                this.loading = false;
                console.error('获取服务失败', err);

                // 结束下拉刷新
                if(refresh) {
                    uni.stopPullDownRefresh();
                }
            });
        },

        selectCategory(categoryId) {
            this.selectedCategory = categoryId;
            this.page = 1;
            this.hasMore = true;
            this.getServices(true);
        },

        onSearchInput() {
            // 防抖处理
            if(this.searchTimer) {
                clearTimeout(this.searchTimer);
            }

            this.searchTimer = setTimeout(() => {
                this.page = 1;
                this.hasMore = true;
                this.getServices(true);
            }, 500);
        },

        loadMore() {
            this.page++;
            this.getServices();
        },

        goServiceDetail(serviceId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.detail, {serviceId});
        }
    }
};
</script>

<style scoped>
.container {
  padding-bottom: 60px;
}

/* 搜索栏 */
.search-bar {
  padding: 10px 16px;
  background-color: white;
  position: fixed;
  top: 2.5rem;
  left: 0;
  right: 0;
  z-index: 10;
}

.search-input {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 20px;
  padding: 0 16px;
  height: 36px;
}

.search-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.input {
  flex: 1;
  height: 100%;
  background-color: transparent;
  border: none;
  font-size: 14px;
}

/* 分类筛选 */
.filter-bar {
  background-color: white;
  margin-top: 56px;
  position: fixed;
  top: 2.5rem;
  left: 0;
  right: 0;
  z-index: 9;
}

.category-scroll {
  white-space: nowrap;
  padding: 12px 0;
}

.category-item {
  display: inline-block;
  padding: 0 16px;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.category-item.active {
  color: var(--primary-color);
  font-weight: bold;
}

/* 服务列表 */
.service-list {
  margin-top: 102px;
  padding: 10px;
}

.service-item {
  display: flex;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.service-image {
  width: 120px;
  height: 120px;
}

.service-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.service-title {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-description {
  font-size: 12px;
  color: var(--text-color-secondary);
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: normal;
}

.service-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.service-price {
  font-size: 16px;
  color: var(--error-color);
  font-weight: bold;
}

.service-duration {
  font-size: 12px;
  color: var(--text-color-disabled);
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
  margin-top: 102px;
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
  margin-top: 102px;
  padding: 40px 0;
  text-align: center;
  color: var(--text-color-secondary);
}
</style>