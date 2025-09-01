// 配置Axios默认请求头
axios.defaults.baseURL = 'http://127.0.0.1:8000';
axios.defaults.headers.post['Content-Type'] = 'application/json';
// 明确启用凭证模式，确保CORS请求正确发送cookies等凭证
axios.defaults.withCredentials = true;

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

    mounted() {
        // 初始化应用
        this.initApp();

        // 更新当前时间
        this.updateCurrentTime();
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
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
            // 根据router.php配置，使用/user/profile路由获取当前登录用户信息（基于token）
            axios.get('/user/profile')
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
            axios.get('/admin/admin/dashboard')
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

        // 获取菜单名称
        getMenuName(menuIndex) {
            const menuMap = {
                'dashboard': '仪表盘',
                'users': '用户管理',
                'categories': '分类管理',
                'services': '服务管理',
                'appointments': '预约管理',
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
                'cancelled': '已取消'
            };
            return statusMap[row.status] || row.status;
        }
    }
});
