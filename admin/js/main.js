// 配置Axios默认请求头
const ADMIN_API_BASE_URL = (() => {
    if (window.__API_BASE_URL__) {
        return window.__API_BASE_URL__;
    }

    const savedBaseURL = localStorage.getItem('adminApiBaseURL');
    if (savedBaseURL) {
        return savedBaseURL;
    }

    return `${window.location.origin}/api`;
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
                'rejected': '已拒绝'
            };
            return statusMap[row.status] || row.status;
        },

        getStatusTagType(status) {
            const typeMap = {
                pending: 'warning',
                accepted: 'success',
                completed: 'primary',
                cancelled: 'info',
                rejected: 'danger'
            };

            return typeMap[status] || 'info';
        }
    }
});
