<template>
  <view class="page">
    <view class="hero-shell">
      <swiper
        class="hero-swiper"
        indicator-dots
        indicator-color="rgba(255,255,255,0.38)"
        indicator-active-color="#ffffff"
        autoplay
        interval="3200"
        circular
      >
        <swiper-item v-for="(item, index) in banners" :key="index">
          <image :src="item.image" mode="aspectFill" class="hero-image"></image>
        </swiper-item>
      </swiper>

      <view class="hero-card">
        <view class="hero-copy">
          <text class="hero-eyebrow">标准服务流程</text>
          <text class="hero-title">把家务交给更靠谱的人</text>
          <text class="hero-subtitle">
            保洁、深度清洁、家电清洗、母婴护理和搬家支持都能在线预约，提交需求后平台会尽快与您确认时间。
          </text>
        </view>

        <view class="hero-actions">
          <view class="hero-action primary" @click="goServiceList(0)">
            <text class="hero-action-title">立即选服务</text>
            <text class="hero-action-tip">查看全部服务项目</text>
          </view>
          <view class="hero-action ghost" @click="goAppointmentList">
            <text class="hero-action-title">我的预约</text>
            <text class="hero-action-tip">随时查看进度</text>
          </view>
        </view>

        <view class="hero-stats">
          <view v-for="item in trustStats" :key="item.label" class="hero-stat">
            <text class="hero-stat-value">{{ item.value }}</text>
            <text class="hero-stat-label">{{ item.label }}</text>
          </view>
        </view>

        <view class="hero-journey">
          <view v-for="item in heroJourney" :key="item.title" class="hero-journey-item">
            <text class="hero-journey-step">{{ item.step }}</text>
            <view class="hero-journey-copy">
              <text class="hero-journey-title">{{ item.title }}</text>
              <text class="hero-journey-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">快捷入口</text>
          <text class="section-subtitle">常用操作放在首屏，减少重复跳转</text>
        </view>
      </view>
      <view class="quick-grid">
        <view class="quick-item accent" @click="goServiceList(0)">
          <text class="quick-title">全部服务</text>
          <text class="quick-desc">快速浏览平台可预约项目</text>
        </view>
        <view class="quick-item" @click="goAppointmentList">
          <text class="quick-title">我的预约</text>
          <text class="quick-desc">查看待接单、已完成和取消记录</text>
        </view>
        <view class="quick-item" @click="goUserCenter">
          <text class="quick-title">个人中心</text>
          <text class="quick-desc">完善资料、管理地址和账号设置</text>
        </view>
        <view class="quick-item warm" @click="goJobApply">
          <text class="quick-title">家政求职</text>
          <text class="quick-desc">服务人员可直接提交报名信息</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">第一次预约怎么走更省时间</text>
          <text class="section-subtitle">把“先看什么、再做什么”直接放到首页，减少决策犹豫</text>
        </view>
      </view>
      <view class="route-list">
        <view
          v-for="item in decisionRoutes"
          :key="item.title"
          class="route-item"
          @click="goDecisionRoute(item)"
        >
          <view class="route-top">
            <text class="route-step">{{ item.step }}</text>
            <text class="route-action">{{ item.actionText }}</text>
          </view>
          <text class="route-title">{{ item.title }}</text>
          <text class="route-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">服务分类</text>
          <text class="section-subtitle">按家庭场景快速筛选，更容易找到合适服务</text>
        </view>
      </view>
      <view class="category-grid">
        <view
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          @click="goServiceList(category.id)"
        >
          <image :src="`/static/images/${category.icon}`" mode="aspectFit" class="category-icon"></image>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">不知道怎么选时</text>
          <text class="section-subtitle">先从最常见的家庭场景开始，缩短决策时间</text>
        </view>
      </view>
      <view class="scenario-list">
        <view
          v-for="item in demandScenarios"
          :key="item.title"
          class="scenario-item"
          @click="goScenario(item)"
        >
          <text class="scenario-title">{{ item.title }}</text>
          <text class="scenario-desc">{{ item.desc }}</text>
          <text class="scenario-action">{{ item.actionText }}</text>
        </view>
      </view>
    </view>

    <view class="job-entry" @click="goJobApply">
      <view class="job-content">
        <text class="job-title">家政从业者入口</text>
        <text class="job-subtitle">填写求职信息后，平台会根据地区和服务能力安排后续联系</text>
      </view>
      <text class="job-action">立即报名</text>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">热门服务</text>
          <text class="section-subtitle">更适合家庭高频需求的项目优先展示</text>
        </view>
        <text class="section-link" @click="goServiceList(0)">查看全部</text>
      </view>

      <view v-if="featuredService" class="featured-service" @click="goServiceDetail(featuredService.id)">
        <image :src="featuredService.image" mode="aspectFill" class="featured-image"></image>
        <view class="featured-mask">
          <view class="featured-badge">主推服务</view>
          <text class="featured-title">{{ featuredService.title }}</text>
          <text class="featured-desc">{{ featuredService.plain_description || '专业服务，省心到家' }}</text>
          <view class="featured-meta">
            <text class="featured-price">¥{{ formatCurrency(featuredService.price) }}</text>
            <text class="featured-duration">{{ featuredService.duration || 60 }}分钟起</text>
          </view>
        </view>
      </view>

      <view v-if="secondaryServices.length" class="service-grid">
        <view
          v-for="service in secondaryServices"
          :key="service.id"
          class="service-item"
          @click="goServiceDetail(service.id)"
        >
          <image :src="service.image" mode="aspectFill" class="service-image"></image>
          <view class="service-content">
            <text class="service-title">{{ service.title }}</text>
            <text class="service-desc">{{ service.plain_description || '专业服务，省心到家' }}</text>
            <view class="service-meta">
              <text class="service-price">¥{{ formatCurrency(service.price) }}</text>
              <text class="service-duration">{{ service.duration || 60 }}分钟起</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="loadingHot" class="inline-state">
        <text>热门服务加载中...</text>
      </view>

      <view v-else-if="!featuredService" class="inline-state">
        <text>暂时还没有推荐服务</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">为什么用户更愿意在线预约</text>
          <text class="section-subtitle">把服务选择、时间确认和进度跟踪放进一个闭环里</text>
        </view>
      </view>
      <view class="promise-list">
        <view v-for="item in servicePromises" :key="item.title" class="promise-item">
          <text class="promise-title">{{ item.title }}</text>
          <text class="promise-desc">{{ item.desc }}</text>
        </view>
      </view>
      <view class="confidence-strip">
        <view v-for="item in bookingConfidence" :key="item.title" class="confidence-item">
          <text class="confidence-title">{{ item.title }}</text>
          <text class="confidence-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="section-header">
        <view>
          <text class="section-title">预约前准备</text>
          <text class="section-subtitle">提前准备这些信息，平台确认会更顺畅</text>
        </view>
      </view>
      <view class="prep-list">
        <view v-for="item in bookingChecklist" :key="item.title" class="prep-item">
          <text class="prep-title">{{ item.title }}</text>
          <text class="prep-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="notice-card">
      <image src="/static/images/notice.svg" mode="aspectFit" class="notice-icon"></image>
      <view class="notice-content">
        <text class="notice-title">预约流程</text>
        <view class="flow-list">
          <text v-for="(step, index) in serviceFlow" :key="step" class="flow-item">
            {{ index + 1 }}. {{ step }}
          </text>
        </view>
        <text class="notice-text">{{ noticeText }}</text>
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
            banners: [
                { image: '/static/images/banner1.svg' },
                { image: '/static/images/banner2.svg' },
                { image: '/static/images/banner3.svg' }
            ],
            categories: [],
            hotServices: [],
            loadingHot: false,
            noticeText: '提交订单后平台会主动联系您复核地址、服务需求和上门时间，避免信息遗漏导致反复沟通。',
            trustStats: [
                { value: '2小时内', label: '客服响应' },
                { value: '全程可查', label: '预约进度' },
                { value: '严选服务', label: '人员审核' }
            ],
            heroJourney: [
                {
                    step: '01',
                    title: '先判断需求',
                    desc: '从家庭场景、服务分类或主推项目里快速进入。'
                },
                {
                    step: '02',
                    title: '提交预约信息',
                    desc: '把联系人、地址和时间一次填清，减少反复沟通。'
                },
                {
                    step: '03',
                    title: '等待平台确认',
                    desc: '平台会主动回访确认细节，预约状态也会持续更新。'
                }
            ],
            servicePromises: [
                {
                    title: '下单信息一次说清',
                    desc: '服务、时间、地址和备注集中填写，避免线下多轮重复确认。'
                },
                {
                    title: '预约进度随时查看',
                    desc: '待接单、已接单、已完成等状态都会在“我的预约”里同步更新。'
                },
                {
                    title: '适合高频家庭需求',
                    desc: '从日常保洁到母婴护理都能统一入口预约，减少分散咨询成本。'
                }
            ],
            bookingConfidence: [
                {
                    title: '不会盲目下单',
                    desc: '先看服务详情，再由平台人工复核需求，减少选错服务的担心。'
                },
                {
                    title: '不怕流程断掉',
                    desc: '登录、注册和预约都围绕同一条业务链路设计，进度可持续衔接。'
                },
                {
                    title: '后续可复用',
                    desc: '联系人、地址和预约记录会沉淀到账户里，二次下单更快。'
                }
            ],
            bookingChecklist: [
                {
                    title: '确认联系人和电话',
                    desc: '平台会优先按预约单里的联系人信息回访，减少因为号码不一致导致的确认失败。'
                },
                {
                    title: '准备准确服务地址',
                    desc: '地址越完整，越方便平台判断服务范围并安排上门时间。'
                },
                {
                    title: '提前写清特殊需求',
                    desc: '如果有重点清洁区域、宠物或时间限制，建议在备注里一次说明。'
                }
            ],
            demandScenarios: [
                {
                    title: '想先解决日常家务堆积',
                    desc: '更适合先看保洁、深度清洁这类高频服务。',
                    categoryId: 0,
                    keyword: '保洁',
                    actionText: '去看保洁服务'
                },
                {
                    title: '家里有母婴或陪护需求',
                    desc: '建议优先筛母婴护理，再看服务说明和备注承接范围。',
                    categoryId: 0,
                    keyword: '母婴',
                    actionText: '去看母婴服务'
                },
                {
                    title: '需要一次性处理设备或重点区域',
                    desc: '家电清洗、专项清洁通常更适合这种明确需求。',
                    categoryId: 0,
                    keyword: '清洗',
                    actionText: '去看专项服务'
                }
            ],
            serviceFlow: [
                '选择服务并提交预约需求',
                '平台联系确认上门时间和服务细节',
                '服务完成后在预约列表查看结果'
            ]
        };
    },
    computed: {
        featuredService() {
            return this.hotServices[0] || null;
        },
        secondaryServices() {
            return this.hotServices.slice(1, 4);
        },
        decisionRoutes() {
            return [
                {
                    step: '路线 A',
                    title: '我还没想清楚选哪项服务',
                    desc: '先按常见家庭场景进入，再看同类服务的描述、时长和备注承接范围。',
                    actionText: '先按场景找',
                    type: 'scenario',
                    payload: this.demandScenarios[0]
                },
                {
                    step: '路线 B',
                    title: '我已经知道大概需要什么',
                    desc: '直接去服务列表，通过分类和关键词快速缩小范围，尽快进入详情页。',
                    actionText: '直接去服务池',
                    type: 'service-list',
                    payload: {
                        categoryId: 0,
                        keyword: ''
                    }
                },
                {
                    step: '路线 C',
                    title: '我更关心预约会不会麻烦',
                    desc: '可以先看预约中心和流程说明，确认后续如何跟进、查看状态和再次下单。',
                    actionText: '先看预约中心',
                    type: 'appointment-list'
                }
            ];
        }
    },
    onLoad() {
        this.getCategories();
        this.getHotServices();
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
                    uni.showToast({
                        title: '分类加载失败',
                        icon: 'none'
                    });
                });
        },
        getHotServices() {
            this.loadingHot = true;

            this.$request
                .get(API_CONFIG.endpoints.service.getServices, {
                    page: 1,
                    page_size: 4
                })
                .then((res) => {
                    const list = (res.data?.list || []).map((item) => normalizeService(item));
                    this.hotServices = list;
                })
                .catch(() => {
                    this.hotServices = [];
                })
                .finally(() => {
                    this.loadingHot = false;
                });
        },
        goServiceList(categoryId = 0) {
            uni.setStorageSync(SERVICE_LIST_FILTERS_KEY, {
                categoryId,
                keyword: '',
                resetSearch: true,
                source: 'index'
            });
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goScenario(item) {
            uni.setStorageSync(SERVICE_LIST_FILTERS_KEY, {
                categoryId: item.categoryId || 0,
                keyword: item.keyword || '',
                resetSearch: true,
                source: 'index-scenario'
            });
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goDecisionRoute(item) {
            if (item.type === 'scenario' && item.payload) {
                this.goScenario(item.payload);
                return;
            }

            if (item.type === 'service-list') {
                this.goServiceList(item.payload?.categoryId || 0);
                return;
            }

            if (item.type === 'appointment-list') {
                this.goAppointmentList();
            }
        },
        goServiceDetail(serviceId) {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.service.detail, { serviceId });
        },
        goAppointmentList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
        },
        goUserCenter() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.user.profile);
        },
        goJobApply() {
            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.job.apply);
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
    radial-gradient(circle at top right, rgba(70, 169, 115, 0.18), transparent 34%),
    linear-gradient(180deg, #eef8f1 0%, #f5f7f8 240px, #f7f7f7 100%);
}

.hero-shell {
  position: relative;
}

.hero-swiper {
  height: 216px;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 18px 42px rgba(22, 110, 72, 0.18);
}

.hero-image {
  width: 100%;
  height: 100%;
}

.hero-card {
  margin-top: -42px;
  margin-left: 14px;
  margin-right: 14px;
  padding: 22px 18px 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
}

.hero-copy {
  display: flex;
  flex-direction: column;
}

.hero-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #2f855a;
}

.hero-title {
  display: block;
  margin-top: 10px;
  font-size: 24px;
  line-height: 1.3;
  font-weight: 700;
  color: #17212f;
}

.hero-subtitle {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #5b6472;
}

.hero-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.hero-action {
  padding: 14px 14px;
  border-radius: 18px;
}

.hero-action.primary {
  background: linear-gradient(135deg, #1f8f44 0%, #36b26c 100%);
  color: #ffffff;
}

.hero-action.ghost {
  background: #f4f6f8;
  color: #17212f;
}

.hero-action-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
}

.hero-action-tip {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.5;
  opacity: 0.82;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.hero-stat {
  padding: 12px 8px;
  border-radius: 16px;
  background: #f7faf8;
  text-align: center;
}

.hero-stat-value {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #17212f;
}

.hero-stat-label {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #6b7280;
}

.hero-journey {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.hero-journey-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7fbf8 0%, #eff8f1 100%);
}

.hero-journey-step {
  min-width: 38px;
  height: 24px;
  line-height: 24px;
  border-radius: 999px;
  background: rgba(31, 143, 68, 0.12);
  font-size: 11px;
  text-align: center;
  color: #1f8f44;
}

.hero-journey-copy {
  flex: 1;
}

.hero-journey-title {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #17212f;
}

.hero-journey-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #5f6b76;
}

.section-card,
.notice-card {
  margin-top: 16px;
  padding: 18px 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 14px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.section-subtitle,
.section-link {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.section-link {
  margin-top: 0;
  color: #1d8e47;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-item {
  min-height: 108px;
  padding: 16px 14px;
  border-radius: 18px;
  background: #f7faf8;
  border: 1px solid rgba(17, 24, 39, 0.04);
}

.quick-item.accent {
  background: linear-gradient(135deg, #eef8f1 0%, #def3e2 100%);
}

.quick-item.warm {
  background: linear-gradient(135deg, #fff7ec 0%, #ffe9c9 100%);
}

.quick-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #17212f;
}

.quick-desc {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #5f6b76;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.route-item {
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f6faf7 100%);
  border: 1px solid rgba(31, 143, 68, 0.08);
}

.route-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.route-step {
  font-size: 11px;
  color: #1d8e47;
}

.route-action {
  font-size: 12px;
  color: #1d8e47;
}

.route-title {
  display: block;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #173126;
}

.route-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.category-item {
  width: 25%;
  padding: 10px 0 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.category-icon {
  width: 54px;
  height: 54px;
  padding: 10px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f4fbf5 0%, #edf8ef 100%);
}

.category-name {
  margin-top: 10px;
  font-size: 12px;
  color: #374151;
  text-align: center;
}

.scenario-item {
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f4faf5 100%);
  border: 1px solid rgba(38, 122, 76, 0.08);
}

.scenario-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #173126;
}

.scenario-desc {
  display: block;
  margin-top: 7px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.scenario-action {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: #1d8e47;
}

.job-entry {
  margin-top: 16px;
  padding: 20px 18px;
  border-radius: 24px;
  background: linear-gradient(135deg, #1e5f44 0%, #2f8f62 48%, #58b870 100%);
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 14px 30px rgba(34, 139, 74, 0.22);
}

.job-content {
  flex: 1;
  padding-right: 12px;
}

.job-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
}

.job-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
}

.job-action {
  padding: 9px 15px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  font-weight: 600;
}

.featured-service {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  background: #0f172a;
  margin-bottom: 12px;
}

.featured-image {
  width: 100%;
  height: 176px;
}

.featured-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.82) 100%);
}

.featured-badge {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 11px;
  color: #ffffff;
}

.featured-title {
  display: block;
  margin-top: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

.featured-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
}

.featured-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.featured-price {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}

.featured-duration {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.74);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.service-item {
  overflow: hidden;
  border-radius: 18px;
  background: #f8faf8;
}

.service-image {
  width: 100%;
  height: 118px;
}

.service-content {
  padding: 12px;
}

.service-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.service-desc {
  display: block;
  min-height: 34px;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: #6b7280;
}

.service-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.service-price {
  font-size: 16px;
  font-weight: 700;
  color: #1aad19;
}

.service-duration {
  font-size: 12px;
  color: #6b7280;
}

.promise-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prep-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.promise-item {
  padding: 14px;
  border-radius: 18px;
  background: #f7faf8;
}

.prep-item {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fcfdfc 0%, #f3f8f4 100%);
  border: 1px solid rgba(38, 122, 76, 0.08);
}

.promise-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #17212f;
}

.promise-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #5f6b76;
}

.confidence-strip {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.confidence-item {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7fbf8 0%, #eff8f1 100%);
}

.confidence-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #173126;
}

.confidence-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: #5f6b76;
}

.prep-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #173126;
}

.prep-desc {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #5f6b76;
}

.inline-state {
  padding: 30px 0 12px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.notice-card {
  display: flex;
  align-items: flex-start;
}

.notice-icon {
  width: 22px;
  height: 22px;
  margin-right: 10px;
  margin-top: 2px;
}

.notice-content {
  flex: 1;
}

.notice-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.flow-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.flow-item {
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

.notice-text {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #6b7280;
}
</style>
