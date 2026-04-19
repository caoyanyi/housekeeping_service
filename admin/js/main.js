// 配置Axios默认请求头
const ADMIN_API_BASE_URL = (() => {
    if (window.__API_BASE_URL__) {
        return window.__API_BASE_URL__;
    }

    const savedBaseURL = localStorage.getItem('adminApiBaseURL');
    if (savedBaseURL) {
        return savedBaseURL;
    }

    return 'https://api.jz.okrcn.com';
})();

axios.defaults.baseURL = ADMIN_API_BASE_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';
// 明确启用凭证模式，确保CORS请求正确发送cookies等凭证
axios.defaults.withCredentials = true;
axios.defaults.timeout = 15000;

// 请求拦截器
axios.interceptors.request.use(
    config => {
        // 确保headers对象存在
        config.headers = config.headers || {};
        // 从localStorage中获取token
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            if (error.response.status === 401) {
                // 未授权，跳转到登录页面
                localStorage.removeItem('adminToken');
                location.reload();
            }
        }
        return Promise.reject(error);
    }
);

// 格式化时间
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 格式化日期
function formatOnlyDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取当前时间
function getCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[now.getDay()];
    return `${year}年${month}月${day}日 星期${weekday} ${hour}:${minute}:${second}`;
}

// 主Vue应用
const app = new Vue({
    el: '#app',
    data() {
        return {
            isLogin: localStorage.getItem('adminToken') ? true : false,
            activeMenu: 'dashboard',
            currentTime: '',
            clockTimer: null,
            adminInfo: {
                username: ''
            },

            // 登录表单
            loginForm: {
                username: '',
                password: ''
            },
            loginRules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' }
                ]
            },
            loginLoading: false,

            // 统计数据
            statistics: {
                users: 0,
                services: 0,
                categories: 0,
                todayAppointments: 0
            },

            // 最近预约
            recentAppointments: []
        };
    },

    computed: {
        dashboardGreeting() {
            const hour = new Date().getHours();
            if (hour < 12) {
                return '上午好';
            }
            if (hour < 18) {
                return '下午好';
            }
            return '晚上好';
        },

        pendingAppointmentsCount() {
            return this.recentAppointments.filter(item => item.status === 'pending').length;
        },

        acceptedAppointmentsCount() {
            return this.recentAppointments.filter(item => item.status === 'accepted').length;
        },

        completedAppointmentsCount() {
            return this.recentAppointments.filter(item => item.status === 'completed').length;
        },

        exceptionAppointmentsCount() {
            return this.recentAppointments.filter(item => ['cancelled', 'rejected', 'no_show'].includes(item.status)).length;
        },

        serviceCoverageDensity() {
            if (!this.statistics.categories) {
                return '0.0';
            }

            return (this.statistics.services / this.statistics.categories).toFixed(1);
        },

        dashboardHeadline() {
            if (this.pendingAppointmentsCount > 0) {
                return `当前有 ${this.pendingAppointmentsCount} 笔预约待跟进`;
            }
            if (this.acceptedAppointmentsCount > 0) {
                return `已有 ${this.acceptedAppointmentsCount} 笔预约进入服务准备阶段`;
            }
            return '今日运营状态平稳，可以继续优化服务供给';
        },

        dashboardSubtext() {
            if (!this.recentAppointments.length) {
                return '最近暂无预约记录，建议先检查服务配置、分类展示和投放入口。';
            }

            return `最近 ${this.recentAppointments.length} 笔预约会在这里汇总，方便你优先处理待接单、已接单和异常状态。`;
        },

        dashboardCards() {
            return [
                {
                    title: '用户总数',
                    value: this.statistics.users,
                    note: '累计注册用户规模',
                    icon: 'fa fa-users',
                    iconClass: 'bg-blue'
                },
                {
                    title: '服务总数',
                    value: this.statistics.services,
                    note: '当前可维护的服务池',
                    icon: 'fa fa-cogs',
                    iconClass: 'bg-green'
                },
                {
                    title: '分类总数',
                    value: this.statistics.categories,
                    note: '服务类目布局情况',
                    icon: 'fa fa-th-list',
                    iconClass: 'bg-purple'
                },
                {
                    title: '今日预约',
                    value: this.statistics.todayAppointments,
                    note: this.pendingAppointmentsCount ? `其中 ${this.pendingAppointmentsCount} 笔待接单` : '当前暂无待接单提醒',
                    icon: 'fa fa-calendar',
                    iconClass: 'bg-orange'
                }
            ];
        },

        dashboardMomentumCards() {
            const pendingCount = this.pendingAppointmentsCount;
            const acceptedCount = this.acceptedAppointmentsCount;
            const servicesPerCategory = this.serviceCoverageDensity;
            const todayFlowValue = this.statistics.todayAppointments || this.recentAppointments.length;

            return [
                {
                    title: '预约承接压力',
                    value: pendingCount ? `${pendingCount} 笔待处理` : '当前平稳',
                    desc: pendingCount
                        ? '说明仍有预约等待首轮确认，建议优先推进待接单。'
                        : '待接单压力不高，可以把精力放到供给和转化优化。',
                    type: pendingCount ? 'warning' : 'success'
                },
                {
                    title: '服务供给密度',
                    value: `${servicesPerCategory} 项/分类`,
                    desc: this.statistics.services >= this.statistics.categories * 2
                        ? '分类下可选服务相对充足，适合继续优化展示和排序。'
                        : '部分分类可能仍偏薄，建议持续补充服务项目和差异化卖点。',
                    type: this.statistics.services >= this.statistics.categories * 2 ? 'success' : 'info'
                },
                {
                    title: '今日订单流入',
                    value: todayFlowValue ? `${todayFlowValue} 笔` : '暂未起量',
                    desc: todayFlowValue
                        ? `最近流入中已有 ${acceptedCount} 笔进入服务准备阶段，可继续跟踪履约。`
                        : '建议检查首页推荐、服务上架状态与用户端预约入口是否顺畅。',
                    type: todayFlowValue ? 'info' : 'danger'
                }
            ];
        },

        dashboardRadarCards() {
            const recentActionableCount = this.pendingAppointmentsCount + this.acceptedAppointmentsCount;
            const todayFlowValue = this.statistics.todayAppointments || this.recentAppointments.length;
            const density = Number(this.serviceCoverageDensity);

            return [
                {
                    title: '待立即响应',
                    value: recentActionableCount ? `${recentActionableCount} 笔` : '当前平稳',
                    desc: recentActionableCount
                        ? '待接单和已接单订单会直接影响用户等待感与履约体验。'
                        : '当前没有明显的预约处理积压，可以转向优化供给和展示。',
                    type: recentActionableCount ? 'warning' : 'success'
                },
                {
                    title: '异常订单雷达',
                    value: this.exceptionAppointmentsCount ? `${this.exceptionAppointmentsCount} 笔` : '风险较低',
                    desc: this.exceptionAppointmentsCount
                        ? '取消、拒绝或未履约订单值得回看原因，避免重复损耗转化。'
                        : '近期异常订单不多，说明确认与履约链路相对稳定。',
                    type: this.exceptionAppointmentsCount ? 'danger' : 'success'
                },
                {
                    title: '分类供给覆盖',
                    value: `${this.serviceCoverageDensity} 项/分类`,
                    desc: density >= 2
                        ? '服务池对分类承接相对充分，更适合继续优化排序和转化表达。'
                        : '部分分类可能还偏薄，容易影响用户比较和预约选择。',
                    type: density >= 2 ? 'info' : 'warning'
                },
                {
                    title: '最近流入热度',
                    value: todayFlowValue ? `${todayFlowValue} 笔` : '需要排查',
                    desc: todayFlowValue
                        ? '今天已有订单流入，适合继续盯紧接单响应和服务承接页面。'
                        : '当日流入偏弱时，建议优先检查首页推荐和服务上架可见性。',
                    type: todayFlowValue ? 'info' : 'danger'
                }
            ];
        },

        dashboardActionChecklist() {
            const items = [];

            items.push(
                this.pendingAppointmentsCount
                    ? {
                        step: '01',
                        title: '先清理待接单预约',
                        desc: `当前还有 ${this.pendingAppointmentsCount} 笔待处理预约，优先减少用户等待感。`,
                        menu: 'appointments',
                        actionText: '去处理'
                    }
                    : {
                        step: '01',
                        title: '预约承接当前较稳定',
                        desc: '待接单压力不大，可以转去检查服务页和首页转化入口。',
                        menu: 'services',
                        actionText: '看服务'
                    }
            );

            items.push(
                this.statistics.todayAppointments
                    ? {
                        step: '02',
                        title: '复查今天有流入的服务承接情况',
                        desc: '看看高频服务的价格、图片和描述是否足够支撑当前订单转化。',
                        menu: 'services',
                        actionText: '去维护'
                    }
                    : {
                        step: '02',
                        title: '补看用户端入口是否影响转化',
                        desc: '今日预约为空时，优先检查首页推荐、分类展示和热门服务排序。',
                        menu: 'services',
                        actionText: '去排查'
                    }
            );

            items.push(
                this.statistics.services < this.statistics.categories
                    ? {
                        step: '03',
                        title: '补足服务供给覆盖',
                        desc: '当前服务数量偏少，建议优先补上分类下的基础项目。',
                        menu: 'services',
                        actionText: '去补充'
                    }
                    : {
                        step: '03',
                        title: '同步看供给端是否跟得上',
                        desc: '服务池已经具备一定规模，建议继续跟进求职报名，保证履约弹性。',
                        menu: 'job_applications',
                        actionText: '看报名'
                    }
            );

            return items;
        },

        dashboardFocusItems() {
            const actionable = this.recentAppointments
                .filter(item => ['pending', 'accepted'].includes(item.status))
                .slice(0, 4)
                .map(item => ({
                    id: item.order_no,
                    title: `${item.user_name} · ${item.service_title}`,
                    desc: `${item.appointment_date} ${item.appointment_time}`,
                    status: this.formatStatus(item),
                    statusType: this.getStatusTagType(item.status),
                    actionText: item.status === 'pending' ? '去接单' : '查看详情',
                    menu: 'appointments'
                }));

            if (actionable.length) {
                return actionable;
            }

            return [
                {
                    id: 'empty-services',
                    title: '当前没有待处理预约',
                    desc: '可以优先检查服务配置、分类排序和投放入口。',
                    status: '运营建议',
                    statusType: 'info',
                    actionText: '去看服务',
                    menu: 'services'
                }
            ];
        },

        dashboardQuickLinks() {
            return [
                {
                    menu: 'appointments',
                    title: '预约管理',
                    desc: '优先处理待接单、改期和已接单订单',
                    note: this.pendingAppointmentsCount ? `${this.pendingAppointmentsCount} 笔待跟进` : '暂无积压'
                },
                {
                    menu: 'services',
                    title: '服务管理',
                    desc: '维护价格、时长、图片和上架状态',
                    note: `${this.statistics.services} 项服务`
                },
                {
                    menu: 'users',
                    title: '用户管理',
                    desc: '查看核心用户、资料和冻结状态',
                    note: `${this.statistics.users} 位用户`
                },
                {
                    menu: 'job_applications',
                    title: '求职管理',
                    desc: '跟进入驻报名，补充供给端信息',
                    note: '查看最新申请'
                }
            ];
        },

        dashboardDecisionBoard() {
            const decisions = [];

            decisions.push(
                this.pendingAppointmentsCount
                    ? {
                        type: 'warning',
                        title: '先保预约响应速度',
                        desc: `当前还有 ${this.pendingAppointmentsCount} 笔待接单，越晚响应越容易影响用户信任和转化。`,
                        menu: 'appointments',
                        actionText: '去清理'
                    }
                    : {
                        type: 'success',
                        title: '预约承接节奏暂时稳定',
                        desc: '可以把时间转去优化服务页表达、分类可见性和供给密度。',
                        menu: 'services',
                        actionText: '看服务'
                    }
            );

            decisions.push(
                this.exceptionAppointmentsCount
                    ? {
                        type: 'danger',
                        title: '要回看异常订单原因',
                        desc: '取消、拒绝和未履约订单最能暴露说明不清、确认慢或履约匹配不足的问题。',
                        menu: 'appointments',
                        actionText: '去复盘'
                    }
                    : {
                        type: 'info',
                        title: '可以把重点放回前台转化',
                        desc: '异常订单不多时，更值得继续优化首页推荐、服务详情和筛选路径。',
                        menu: 'services',
                        actionText: '去优化'
                    }
            );

            decisions.push(
                Number(this.serviceCoverageDensity) < 2
                    ? {
                        type: 'warning',
                        title: '服务覆盖仍有补位空间',
                        desc: '分类下可选服务偏少时，用户更难形成比较和下单决策，适合继续补充项目。',
                        menu: 'services',
                        actionText: '去补充'
                    }
                    : {
                        type: 'info',
                        title: '供给侧可以继续跟进入驻转化',
                        desc: '服务池已经有基础规模，下一步更适合盯紧求职跟进和履约弹性。',
                        menu: 'job_applications',
                        actionText: '看报名'
                    }
            );

            return decisions;
        },

        dashboardAlerts() {
            const alerts = [];

            if (this.pendingAppointmentsCount > 0) {
                alerts.push({
                    type: 'warning',
                    title: '待接单预约需要优先跟进',
                    desc: `当前有 ${this.pendingAppointmentsCount} 笔预约处于待接单状态，建议优先确认服务时间和上门安排。`
                });
            }

            if (!this.statistics.services) {
                alerts.push({
                    type: 'danger',
                    title: '当前还没有可维护服务',
                    desc: '建议先补充服务标题、价格、时长和上架状态，避免前台无项目可约。'
                });
            } else if (!this.statistics.todayAppointments) {
                alerts.push({
                    type: 'info',
                    title: '今日预约量暂时为空',
                    desc: '可以检查首页推荐、服务排序和投放入口，确认是否影响转化。'
                });
            }

            if (!this.recentAppointments.length) {
                alerts.push({
                    type: 'info',
                    title: '最近没有新的订单流入',
                    desc: '可同步检查分类展示、服务上架状态以及用户侧入口体验。'
                });
            }

            if (!alerts.length) {
                alerts.push({
                    type: 'info',
                    title: '当前业务运行平稳',
                    desc: '可以继续优化服务详情、首页推荐和预约跟进效率，保持转化与履约体验。'
                });
            }

            return alerts.slice(0, 3);
        }
    },

    mounted() {
        // 初始化应用
        this.initApp();

        // 更新当前时间
        this.updateCurrentTime();
        this.clockTimer = setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    },

    beforeDestroy() {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
            this.clockTimer = null;
        }
    },

    methods: {
        // 初始化应用
        initApp() {
            if (this.isLogin) {
                this.getAdminInfo();
                this.getDashboardData();
            }
        },

        // 更新当前时间
        updateCurrentTime() {
            this.currentTime = getCurrentTime();
        },

        // 获取管理员信息
        getAdminInfo() {
            axios.get('/admin/admin/profile')
                .then(response => {
                    if (response.data.code === 200) {
                        this.adminInfo = response.data.data;
                    }
                })
                .catch(error => {
                    console.error('获取管理员信息失败:', error);
                });
        },

        // 获取仪表盘数据
        getDashboardData() {
            return axios.get('/admin/admin/dashboard')
                .then(response => {
                    if (response.data.code === 200) {
                        this.statistics = response.data.data.statistics;
                        this.recentAppointments = response.data.data.recentAppointments;
                    }
                })
                .catch(error => {
                    console.error('获取仪表盘数据失败:', error);
                });
        },

        refreshDashboard() {
            this.getDashboardData()
                .then(() => {
                    this.$message.success('仪表盘数据已刷新');
                })
                .catch(() => {
                    this.$message.error('仪表盘刷新失败，请稍后重试');
                });
        },

        // 提交登录
        submitLogin() {
            this.$refs.loginForm.validate((valid) => {
                if (valid) {
                    this.loginLoading = true;
                    axios.post('/admin/admin/login', this.loginForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                // 保存token
                                localStorage.setItem('adminToken', response.data.data.token);
                                this.isLogin = true;
                                this.initApp();
                                this.$message.success('登录成功');
                            } else {
                                this.$message.error(response.data.message || '登录失败');
                            }
                        })
                        .catch(error => {
                            console.error('登录失败:', error);
                            this.$message.error('登录失败，请稍后重试');
                        })
                        .finally(() => {
                            this.loginLoading = false;
                        });
                }
            });
        },

        // 退出登录
        logout() {
            this.$confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                localStorage.removeItem('adminToken');
                this.isLogin = false;
                this.loginForm = {
                    username: '',
                    password: ''
                };
                this.$message.success('退出登录成功');
            }).catch(() => {
                // 用户取消
            });
        },

        // 处理菜单选择
        handleMenuSelect(index) {
            this.activeMenu = index;
        },

        jumpToMenu(menu) {
            this.activeMenu = menu;
        },

        // 获取菜单名称
        getMenuName(menuIndex) {
            const menuMap = {
                'dashboard': '仪表盘',
                'users': '用户管理',
                'categories': '分类管理',
                'services': '服务管理',
                'appointments': '预约管理',
                'job_applications': '求职管理',
                'admins': '管理员管理'
            };
            return menuMap[menuIndex] || '';
        },

        // 格式化状态
        formatStatus(row) {
            const statusMap = {
                'pending': '待接单',
                'accepted': '已接单',
                'completed': '已完成',
                'cancelled': '已取消',
                'rejected': '已拒绝',
                'no_show': '未履约'
            };
            return statusMap[row.status] || row.status;
        },

        getStatusTagType(status) {
            const typeMap = {
                pending: 'warning',
                accepted: 'success',
                completed: 'primary',
                cancelled: 'info',
                rejected: 'danger',
                no_show: 'warning'
            };

            return typeMap[status] || 'info';
        }
    }
});
