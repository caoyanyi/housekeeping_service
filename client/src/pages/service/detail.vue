<template>
  <view class="page">
    <view class="hero-shell">
      <swiper
        v-if="serviceInfo && service.image_urls.length"
        class="hero-swiper"
        indicator-dots
        circular
        autoplay
        interval="3200"
      >
        <swiper-item v-for="image in service.image_urls" :key="image">
          <image :src="image" mode="aspectFill" class="hero-image"></image>
        </swiper-item>
      </swiper>

      <view v-if="serviceInfo" class="hero-summary">
        <view class="hero-topline">
          <text class="service-badge">平台严选</text>
          <text class="service-badge light">{{ service.category_name || '品质服务' }}</text>
        </view>
        <text class="hero-title">{{ service.title }}</text>
        <text class="hero-desc">{{ service.plain_description || '专业服务，省心到家' }}</text>
        <view class="hero-metrics">
          <view class="hero-metric">
            <text class="hero-metric-value">¥{{ formatCurrency(service.price) }}</text>
            <text class="hero-metric-label">参考价格</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">{{ service.duration || 60 }}分钟</text>
            <text class="hero-metric-label">预计时长</text>
          </view>
          <view class="hero-metric">
            <text class="hero-metric-value">可预约</text>
            <text class="hero-metric-label">服务状态</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="state-block">
      <text class="state-text">服务详情加载中...</text>
    </view>

    <view v-else-if="serviceInfo" class="content">
      <view class="decision-card">
        <view class="decision-header">
          <view>
            <text class="decision-title">这项服务适合什么场景</text>
            <text class="decision-subtitle">帮用户在下单前快速判断是否匹配当前需求</text>
          </view>
          <text class="decision-price">¥{{ formatCurrency(service.price) }}</text>
        </view>
        <view class="tag-row">
          <text v-for="tag in serviceTags" :key="tag" class="tag">{{ tag }}</text>
        </view>
        <view class="decision-grid">
          <view v-for="item in decisionFacts" :key="item.label" class="decision-item">
            <text class="decision-item-label">{{ item.label }}</text>
            <text class="decision-item-value">{{ item.value }}</text>
          </view>
        </view>
        <view class="decision-brief">
          <text class="decision-brief-title">{{ decisionBrief.title }}</text>
          <text class="decision-brief-desc">{{ decisionBrief.desc }}</text>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">下单前的匹配建议</text>
        <view class="fit-section">
          <view class="fit-card good">
            <text class="fit-card-title">更适合这类情况</text>
            <view class="fit-list">
              <text v-for="item in fitScenarios" :key="item" class="fit-item">{{ item }}</text>
            </view>
          </view>
          <view class="fit-card caution">
            <text class="fit-card-title">建议先补充说明或再比较</text>
            <view class="fit-list">
              <text v-for="item in avoidScenarios" :key="item" class="fit-item">{{ item }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">服务介绍</text>
        <rich-text
          v-if="hasRichText(service.description)"
          class="rich-content"
          :nodes="service.description"
        ></rich-text>
        <text v-else class="section-text">{{ service.description || '暂无服务介绍' }}</text>
      </view>

      <view class="section-card">
        <text class="section-title">预约后你会经历什么</text>
        <view class="journey-list">
          <view v-for="(step, index) in serviceJourney" :key="step.title" class="journey-item">
            <view class="journey-index">{{ index + 1 }}</view>
            <view class="journey-content">
              <text class="journey-title">{{ step.title }}</text>
              <text class="journey-desc">{{ step.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="service.process.length" class="section-card">
        <text class="section-title">服务流程</text>
        <view class="process-list">
          <view v-for="(step, index) in service.process" :key="`${service.id}-${index}`" class="process-item">
            <view class="process-index">{{ index + 1 }}</view>
            <text class="process-text">{{ step }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">服务保障</text>
        <view class="assurance-list">
          <view v-for="item in assuranceList" :key="item.title" class="assurance-item">
            <text class="assurance-title">{{ item.title }}</text>
            <text class="assurance-desc">{{ item.desc }}</text>
          </view>
        </view>
        <view class="confidence-list">
          <view v-for="item in confidenceSignals" :key="item.title" class="confidence-signal">
            <text class="confidence-signal-title">{{ item.title }}</text>
            <text class="confidence-signal-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">如果你还在比较</text>
        <view class="decision-help-list">
          <view v-for="item in decisionHelps" :key="item.title" class="decision-help-item">
            <text class="decision-help-title">{{ item.title }}</text>
            <text class="decision-help-desc">{{ item.desc }}</text>
          </view>
        </view>
        <view class="secondary-actions">
          <button class="secondary-action ghost" @click="viewSimilarServices">看同类服务</button>
          <button class="secondary-action" @click="goAppointmentList">查看我的预约</button>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">下单前常见问题</text>
        <view class="faq-list">
          <view v-for="item in serviceFaqs" :key="item.question" class="faq-item">
            <text class="faq-question">{{ item.question }}</text>
            <text class="faq-answer">{{ item.answer }}</text>
          </view>
        </view>
      </view>

      <view class="section-card emphasis">
        <text class="section-title">下单说明</text>
        <view class="notice-list">
          <text class="notice-item">预约提交后，平台会联系您确认具体上门时间。</text>
          <text class="notice-item">服务价格以页面展示为准，特殊需求可在备注中补充说明。</text>
          <text class="notice-item">如需取消或调整时间，可在“我的预约”中查看并跟进处理。</text>
        </view>
      </view>
    </view>

    <view v-else class="state-block">
      <image src="/static/images/empty.svg" mode="aspectFit" class="state-image"></image>
      <text class="state-text">没有找到对应服务</text>
    </view>

    <view v-if="serviceInfo" class="bottom-bar">
      <view class="bottom-copy">
        <text class="bottom-price">¥{{ formatCurrency(service.price) }}</text>
        <text class="bottom-tip">{{ bottomBookingTip }}</text>
      </view>
      <button class="appointment-button" @click="makeAppointment">{{ bookingButtonText }}</button>
    </view>
  </view>
</template>

<script>
import API_CONFIG from '../../config/api.config';
import ROUTER_CONFIG from '../../config/router.config';
import {
    formatCurrency,
    hasRichText,
    normalizeService,
    SERVICE_LIST_FILTERS_KEY
} from '../../utils/view-models';

export default {
    data() {
        return {
            serviceId: '',
            serviceInfo: null,
            loading: false,
            assuranceList: [
                {
                    title: '平台复核预约信息',
                    desc: '下单后会再次确认服务时间、地址和备注，减少误单和沟通成本。'
                },
                {
                    title: '过程状态清晰可查',
                    desc: '从待接单到已完成，关键状态会同步到“我的预约”。'
                },
                {
                    title: '适合补充个性化需求',
                    desc: '若有特殊清洁区域或时间要求，可在预约备注里提前说明。'
                }
            ],
            serviceFaqs: [
                {
                    question: '提交预约后多久会有人联系我？',
                    answer: '平台会尽快回访确认，通常会优先核对预约时间、地址和是否存在特殊需求。'
                },
                {
                    question: '页面价格是不是最终价格？',
                    answer: '页面价格可作为参考，若现场环境或附加需求有明显差异，平台会在确认环节提前和您沟通。'
                },
                {
                    question: '临时需要改时间怎么办？',
                    answer: '可以先在“我的预约”查看当前状态，并尽快联系平台处理改期或取消，避免影响排班。'
                }
            ],
            serviceJourney: [
                {
                    title: '提交需求',
                    desc: '选择服务并填写联系人、地址、预约时间和备注信息。'
                },
                {
                    title: '平台确认',
                    desc: '客服会主动联系您核对需求，必要时补充服务细节。'
                },
                {
                    title: '上门服务',
                    desc: '确认完成后按预约时间安排服务，结果可在订单中查看。'
                }
            ],
            decisionHelps: [
                {
                    title: '如果你更在意效率',
                    desc: '建议优先看服务时长、备注承接范围，以及是否需要提前准备现场条件。'
                },
                {
                    title: '如果你还在比价格',
                    desc: '可以回到同类服务列表，对比简介、时长和保障信息，而不只看单个价格。'
                },
                {
                    title: '如果需求还不够确定',
                    desc: '先提交最接近的服务需求也可以，平台会在确认环节帮你补充细节。'
                }
            ]
        };
    },
    computed: {
        service() {
            return this.serviceInfo ? normalizeService(this.serviceInfo) : normalizeService();
        },
        serviceTags() {
            return this.service.tags.slice(0, 5);
        },
        decisionFacts() {
            return [
                {
                    label: '服务分类',
                    value: this.service.category_name || '精选服务'
                },
                {
                    label: '预计时长',
                    value: `${this.service.duration || 60}分钟起`
                },
                {
                    label: '预约方式',
                    value: '线上提交需求'
                },
                {
                    label: '确认形式',
                    value: '平台人工复核'
                }
            ];
        },
        decisionBrief() {
            const title = this.service.title || this.service.category_name || '当前服务';
            return {
                title: `如果你想先解决“${title}”这类问题，这项服务已经具备直接进入预约的基础信息。`,
                desc: '页面更适合帮助你先做判断和比较，真正的时间、地址和执行细节会在平台确认环节继续复核。'
            };
        },
        fitScenarios() {
            const keywordText = `${this.service.title} ${this.service.category_name}`.toLowerCase();

            if (keywordText.includes('母婴')) {
                return [
                    '家里近期有产后照护、月嫂或母婴陪护需求',
                    '希望提前沟通服务时间、照护重点和生活习惯',
                    '更在意持续跟进，而不是只完成一次性事务'
                ];
            }

            if (keywordText.includes('清洗')) {
                return [
                    '目标很明确，想一次处理空调、油烟机等设备清洗',
                    '更希望先看项目范围、时长和是否需要现场准备',
                    '愿意在备注里提前说明设备型号或现场情况'
                ];
            }

            if (keywordText.includes('搬')) {
                return [
                    '有明确时间点，需要平台提前确认上门安排',
                    '希望一次补充地址、楼层和物品说明，减少来回问询',
                    '更关注执行流程和现场协调，而不只是基础报价'
                ];
            }

            return [
                '家里有明确的日常保洁、深度清洁或上门处理需求',
                '希望线上先把时间、地址和备注集中提交，再等待平台确认',
                '更看重流程清晰、进度可查，而不是临时电话沟通'
            ];
        },
        avoidScenarios() {
            const keywordText = `${this.service.title} ${this.service.category_name}`.toLowerCase();

            if (keywordText.includes('母婴')) {
                return [
                    '如果照护范围、到岗周期还没有想清楚，建议先在备注里补充期待',
                    '如果只想解决一次性的家务问题，建议先比较保洁或专项清洁服务',
                    '如果家庭成员作息要求特殊，提交前最好写清时间限制'
                ];
            }

            if (keywordText.includes('清洗')) {
                return [
                    '如果设备情况不明确，建议先补充品牌、数量或清洗重点',
                    '如果你真正需要的是全屋保洁，建议同时比较日常保洁服务',
                    '如果现场存在高空、拆装等特殊情况，提交前建议先备注说明'
                ];
            }

            if (keywordText.includes('搬')) {
                return [
                    '如果只是局部整理或清洁，可能需要先比较更轻量的上门服务',
                    '如果物品量、楼层或车辆要求还不明确，建议先备注清楚',
                    '如果时间窗口非常紧，提交后要留意平台回访确认'
                ];
            }

            return [
                '如果你的需求更偏专项设备处理，建议先看清洗类服务是否更匹配',
                '如果时间、地址或重点区域还没想好，建议先补齐信息再预约',
                '如果你主要想比价格，最好回到同类服务里一起比较时长和保障'
            ];
        },
        confidenceSignals() {
            return [
                {
                    title: '先提交，再人工确认细节',
                    desc: '不是用户自己单方面拍板，平台会继续帮你核对服务匹配度和预约信息。'
                },
                {
                    title: '预约状态后续可追踪',
                    desc: '提交后可以在“我的预约”里查看状态变化，减少对进度的不确定感。'
                },
                {
                    title: '适合沉淀下一次复购资料',
                    desc: '这次填写的联系人、地址和备注会帮助后续重复下单更省步骤。'
                }
            ];
        },
        bottomBookingTip() {
            return `提交${this.service.title || '预约'}后，平台会尽快联系您确认时间和服务细节`;
        },
        bookingButtonText() {
            return '填写需求，等待确认';
        }
    },
    onLoad(options) {
        this.serviceId = options?.serviceId || options?.id || '';
        if (!this.serviceId) {
            uni.showToast({
                title: '服务信息不存在',
                icon: 'none'
            });
            return;
        }

        this.getServiceDetail();
    },
    methods: {
        formatCurrency,
        hasRichText,
        getServiceDetail() {
            this.loading = true;

            this.$request
                .get(`${API_CONFIG.endpoints.service.getServices}/${this.serviceId}`)
                .then((res) => {
                    this.serviceInfo = res.data || null;
                })
                .catch(() => {
                    this.serviceInfo = null;
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        makeAppointment() {
            const token = uni.getStorageSync('token');
            if (!token) {
                const redirect = ROUTER_CONFIG.navigate.buildUrl(
                    ROUTER_CONFIG.pages.service.detail,
                    { serviceId: this.serviceId }
                );

                uni.showModal({
                    title: '请先登录',
                    content: '登录后才能提交预约需求，是否现在去登录？',
                    success: ({ confirm }) => {
                        if (confirm) {
                            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login, { redirect });
                        }
                    }
                });
                return;
            }

            ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.appointment.create, {
                serviceId: this.serviceId
            });
        },
        viewSimilarServices() {
            uni.setStorageSync(SERVICE_LIST_FILTERS_KEY, {
                categoryId: Number(this.service.category_id || 0) || 0,
                keyword: this.service.category_name || this.service.title || '',
                resetSearch: true,
                source: 'service-detail'
            });
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.service.list);
        },
        goAppointmentList() {
            ROUTER_CONFIG.navigate.switchTab(ROUTER_CONFIG.pages.appointment.list);
        }
    }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 96px;
  background:
    linear-gradient(180deg, #edf6f1 0%, #f4f6f8 260px, #f6f7f9 100%);
}

.hero-shell {
  position: relative;
}

.hero-swiper {
  height: 316px;
}

.hero-image {
  width: 100%;
  height: 100%;
}

.hero-summary {
  position: relative;
  margin: -84px 16px 0;
  padding: 18px 18px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(10px);
}

.hero-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-badge {
  padding: 6px 12px;
  border-radius: 999px;
  background: #1f8f44;
  font-size: 11px;
  color: #ffffff;
}

.service-badge.light {
  background: #eef5f0;
  color: #2d6a4f;
}

.hero-title {
  display: block;
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 700;
  color: #111827;
}

.hero-desc {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #586273;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.hero-metric {
  padding: 12px 10px;
  border-radius: 18px;
  background: #f7faf8;
  text-align: center;
}

.hero-metric-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.hero-metric-label {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #6b7280;
}

.content {
  padding: 14px 16px 0;
}

.decision-card,
.section-card {
  margin-bottom: 14px;
  padding: 18px 16px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.decision-card {
  background:
    radial-gradient(circle at top right, rgba(47, 143, 98, 0.12), transparent 32%),
    #ffffff;
}

.decision-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.decision-title {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.decision-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.decision-price {
  flex-shrink: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1aad19;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f2f4f7;
  font-size: 12px;
  color: #475467;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.decision-item {
  padding: 12px;
  border-radius: 18px;
  background: #f8faf8;
}

.decision-item-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
}

.decision-item-value {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: #111827;
}

.decision-brief {
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7fbf8 0%, #eef8f0 100%);
}

.decision-brief-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
  color: #173126;
}

.decision-brief-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.section-title {
  display: block;
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.section-text,
.rich-content {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
}

.journey-list,
.process-list,
.notice-list,
.assurance-list,
.faq-list,
.decision-help-list,
.confidence-list,
.fit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.journey-item,
.assurance-item,
.faq-item,
.decision-help-item {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  border-radius: 18px;
  background: #f8faf8;
}

.fit-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fit-card {
  padding: 16px;
  border-radius: 18px;
}

.fit-card.good {
  background: linear-gradient(180deg, #f6fcf7 0%, #edf8f0 100%);
}

.fit-card.caution {
  background: linear-gradient(180deg, #fffaf2 0%, #fdf2df 100%);
}

.fit-card-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #17212f;
}

.fit-item {
  display: block;
  padding-left: 14px;
  position: relative;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.fit-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1aad19;
}

.journey-index,
.process-index {
  width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 50%;
  background: #1aad19;
  color: #ffffff;
  font-size: 12px;
  text-align: center;
  flex-shrink: 0;
}

.journey-content {
  margin-left: 10px;
}

.journey-title,
.assurance-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #17212f;
}

.journey-desc,
.assurance-desc {
  display: block;
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.confidence-list {
  margin-top: 14px;
}

.confidence-signal {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7fbf8 0%, #eef8f0 100%);
}

.confidence-signal-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #17212f;
}

.confidence-signal-desc {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.faq-item {
  display: block;
}

.faq-question {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #17212f;
}

.faq-answer {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.decision-help-item {
  display: block;
}

.decision-help-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #17212f;
}

.decision-help-desc {
  display: block;
  margin-top: 7px;
  font-size: 13px;
  line-height: 1.7;
  color: #5f6b76;
}

.secondary-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.secondary-action {
  flex: 1;
  height: 42px;
  line-height: 42px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: #ffffff;
  font-size: 14px;
}

.secondary-action.ghost {
  background: #ffffff;
  color: #1aad19;
  border: 1px solid rgba(26, 173, 25, 0.22);
}

.process-item {
  display: flex;
  align-items: flex-start;
}

.process-text {
  margin-left: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
}

.emphasis {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbf8 100%);
}

.notice-item {
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
}

.state-block {
  padding: 80px 24px;
  text-align: center;
}

.state-image {
  width: 136px;
  height: 136px;
}

.state-text {
  display: block;
  margin-top: 12px;
  font-size: 14px;
  color: #9ca3af;
}

.bottom-bar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 14px 18px;
  border-radius: 18px;
  background: rgba(17, 24, 39, 0.96);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
}

.bottom-copy {
  flex: 1;
  padding-right: 12px;
}

.bottom-price {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}

.bottom-tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
}

.appointment-button {
  min-width: 132px;
  height: 42px;
  margin: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #1aad19 0%, #36c567 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
}
</style>
