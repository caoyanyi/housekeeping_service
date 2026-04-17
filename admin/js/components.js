function parseImageUrlText(text = '') {
    return String(text)
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(Boolean);
}

function stringifyImageUrls(imageUrls) {
    if (Array.isArray(imageUrls)) {
        return imageUrls.filter(Boolean).join('\n');
    }

    if (typeof imageUrls === 'string') {
        try {
            const parsed = JSON.parse(imageUrls);
            if (Array.isArray(parsed)) {
                return parsed.filter(Boolean).join('\n');
            }
        } catch (error) {
            return imageUrls;
        }
    }

    return '';
}

const JOB_STATUS_TEXT_MAP = {
    pending: '待处理',
    reviewed: '已查看',
    contacted: '已联系',
    rejected: '已拒绝'
};

const APPOINTMENT_STATUS_TEXT_MAP = {
    pending: '待接单',
    accepted: '已接单',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已拒绝',
    no_show: '未履约'
};

function getActionErrorMessage(error, fallback = '操作未完成，请稍后重试') {
    return error?.response?.data?.message || fallback;
}

function showActionError(vm, error, fallback = '操作未完成，请稍后重试') {
    console.error(fallback, error);
    vm.$message.error(getActionErrorMessage(error, fallback));
}

function showActionSuccess(vm, message) {
    vm.$message.success(message);
}

// 注册求职管理组件
Vue.component('job-applications', {
    template: '#job-applications-template',
    data() {
        return {
            jobApplicationsData: [],
            searchText: '',
            status: '',
            quickStatusFilter: '',
            currentPage: 1,
            pageSize: 10,
            total: 0,
            loading: false,
            submitting: false,
            viewDialogVisible: false,
            editDialogVisible: false,
            viewForm: {
                id: '',
                name: '',
                phone: '',
                id_card: '',
                address: '',
                birth_place: '',
                certificates: [],
                work_years: 0,
                work_area: '',
                notes: '',
                status: '',
                created_at: ''
            },
            editForm: {
                id: '',
                name: '',
                phone: '',
                id_card: '',
                address: '',
                birth_place: '',
                work_years: 0,
                work_area: '',
                notes: '',
                status: ''
            },
            jobApplicationRules: {
                name: [
                    { required: true, message: '请输入姓名', trigger: 'blur' }
                ],
                phone: [
                    { required: true, message: '请输入电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
                ],
                id_card: [
                    { required: true, message: '请输入身份证号', trigger: 'blur' }
                ]
            }
        };
    },
    mounted() {
        this.getJobApplications();
    },
    computed: {
        visibleJobApplicationsData() {
            if (!this.quickStatusFilter) {
                return this.jobApplicationsData;
            }

            return this.jobApplicationsData.filter(item => item.status === this.quickStatusFilter);
        },
        jobOverviewCards() {
            const counts = this.jobApplicationsData.reduce((result, item) => {
                const key = item.status || 'pending';
                result[key] = (result[key] || 0) + 1;
                if (this.getJobProfileHealth(item) !== '资料完整') {
                    result.incomplete += 1;
                }
                return result;
            }, {
                pending: 0,
                reviewed: 0,
                contacted: 0,
                rejected: 0,
                incomplete: 0
            });

            return [
                {
                    title: '本页申请',
                    value: this.jobApplicationsData.length,
                    desc: '当前分页已加载',
                    filterValue: ''
                },
                {
                    title: '待处理',
                    value: counts.pending,
                    desc: '建议优先查看',
                    filterValue: 'pending'
                },
                {
                    title: '已联系',
                    value: counts.contacted,
                    desc: '进入跟进阶段',
                    filterValue: 'contacted'
                },
                {
                    title: '资料待补',
                    value: counts.incomplete,
                    desc: '证件或区域信息不完整',
                    filterValue: ''
                }
            ];
        },
        jobFocusTitle() {
            if (this.quickStatusFilter === 'pending') {
                return '当前正在处理待跟进报名';
            }

            const pendingCount = this.jobApplicationsData.filter(item => item.status === 'pending').length;
            if (pendingCount > 0) {
                return `本页有 ${pendingCount} 位服务人员等待初次处理`;
            }

            return '本页供给跟进节奏较稳定';
        },
        jobFocusText() {
            if (this.quickStatusFilter === 'pending') {
                return '建议先判断报名信息是否完整，再尽快推进到已查看或已联系状态。';
            }

            return '优先联系资料完整、工作区域清晰的申请人，能更快补足服务供给。';
        },
        jobFocusFilter() {
            return this.quickStatusFilter === 'pending' ? '' : 'pending';
        },
        jobDetailActionOptions() {
            const optionMap = {
                pending: [
                    { label: '标记已查看', value: 'reviewed' },
                    { label: '标记已联系', value: 'contacted' }
                ],
                reviewed: [
                    { label: '标记已联系', value: 'contacted' },
                    { label: '标记已拒绝', value: 'rejected' }
                ],
                contacted: [
                    { label: '重新标记待处理', value: 'pending' }
                ]
            };

            return optionMap[this.viewForm.status] || [];
        },
        currentJobGuide() {
            const guideMap = {
                pending: '建议先核对身份、区域和工作年限，再决定是否进入联系阶段。',
                reviewed: '说明该申请已完成初步查看，下一步可尽快联系确认到岗意向。',
                contacted: '该申请已进入沟通阶段，建议在线下持续跟进转化结果。',
                rejected: '该申请已结束处理，建议复盘拒绝原因，优化后续筛选标准。'
            };

            return guideMap[this.viewForm.status] || '在这里可以查看候选人信息并推进供给跟进。';
        }
    },
    methods: {
        // 获取求职申请列表
        getJobApplications() {
            this.loading = true;
            axios.get('/admin/job/application/applications', {
                params: {
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    search: this.searchText,
                    status: this.status
                }
            })
                .then(response => {
                    if (response.data.code === 200) {
                        this.jobApplicationsData = response.data.data.list || [];
                        this.total = response.data.data.total || 0;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '求职申请列表加载失败，请稍后重试');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 搜索求职申请
        searchJobApplications() {
            this.currentPage = 1;
            this.getJobApplications();
        },

        resetFilters() {
            this.searchText = '';
            this.status = '';
            this.quickStatusFilter = '';
            this.currentPage = 1;
            this.getJobApplications();
        },

        applyQuickStatusFilter(status = '') {
            this.quickStatusFilter = status;
        },
        
        // 查看求职申请详情
        viewJobApplication(row) {
            axios.get(`/admin/job/application/applications/${row.id}`)
                .then(response => {
                    if (response.data.code === 200) {
                        this.viewForm = {
                            ...response.data.data.data,
                            status: response.data.data.data.status || 'pending'
                        };
                        this.viewDialogVisible = true;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '求职申请详情加载失败，请稍后重试');
                });
        },
        
        // 编辑求职申请
        editJobApplication(row) {
            axios.get(`/admin/job/application/applications/${row.id}`)
                .then(response => {
                    if (response.data.code === 200) {
                        this.editForm = { ...response.data.data.data };
                        // 排除证书字段，因为编辑界面不处理证书上传
                        if (this.editForm.certificates) {
                            delete this.editForm.certificates;
                        }
                        this.editDialogVisible = true;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '求职申请详情加载失败，请稍后重试');
                });
        },

        quickUpdateJobStatus(row, nextStatus, keepDialogOpen = false) {
            if (!row?.id || !nextStatus) {
                return;
            }

            this.submitting = true;
            axios.put(`/admin/job/application/applications/${row.id}`, {
                status: nextStatus
            })
                .then(response => {
                    if (response.data.code === 200) {
                        const target = this.jobApplicationsData.find(item => String(item.id) === String(row.id));
                        if (target) {
                            target.status = nextStatus;
                        }

                        if (String(this.viewForm.id) === String(row.id)) {
                            this.viewForm = {
                                ...this.viewForm,
                                status: nextStatus
                            };
                        }

                        showActionSuccess(this, `报名状态已更新为${this.getStatusText(nextStatus)}`);

                        if (!keepDialogOpen) {
                            this.viewDialogVisible = false;
                        }
                    } else {
                        this.$message.error(response.data.message || '求职申请更新失败');
                    }
                })
                .catch(error => {
                    showActionError(this, error, '求职申请更新失败，请稍后重试');
                })
                .finally(() => {
                    this.submitting = false;
                });
        },
        
        // 更新求职申请
        updateJobApplication() {
            this.$refs.editForm.validate((valid) => {
                if (valid) {
                    this.submitting = true;
                    axios.put(`/admin/job/application/applications/${this.editForm.id}`, this.editForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                showActionSuccess(this, '求职申请已更新');
                                this.editDialogVisible = false;
                                this.getJobApplications();
                            } else {
                                this.$message.error(response.data.message || '求职申请更新失败');
                            }
                        })
                        .catch(error => {
                            showActionError(this, error, '求职申请更新失败，请稍后重试');
                        })
                        .finally(() => {
                            this.submitting = false;
                        });
                }
            });
        },
        
        // 删除求职申请
        deleteJobApplication(id) {
            this.$confirm('确定要删除该求职申请吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                axios.delete(`/admin/job/application/applications/${id}`)
                    .then(response => {
                        if (response.data.code === 200) {
                            showActionSuccess(this, '求职申请已删除');
                            this.getJobApplications();
                        } else {
                            this.$message.error(response.data.message || '求职申请删除失败');
                        }
                    })
                    .catch(error => {
                        showActionError(this, error, '求职申请删除失败，请稍后重试');
                    });
            }).catch(() => {
                // 用户取消
            });
        },
        
        // 处理分页大小变化
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.getJobApplications();
        },
        
        // 处理当前页码变化
        handleCurrentChange(current) {
            this.currentPage = current;
            this.getJobApplications();
        },
        
        // 获取状态文本
        getStatusText(status) {
            return JOB_STATUS_TEXT_MAP[status] || status;
        },
        
        // 获取状态标签类型
        getStatusType(status) {
            const typeMap = {
                'pending': 'warning',
                'reviewed': 'info',
                'contacted': 'success',
                'rejected': 'danger'
            };
            return typeMap[status] || 'default';
        },
        
        // 获取证书文本
        getCertificatesText(certificates) {
            if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
                return '-';
            }
            return certificates.join('，');
        },

        getJobProfileHealth(row) {
            const hasIdentity = Boolean(row.id_card);
            const hasArea = Boolean(row.work_area);
            const hasYears = Number(row.work_years || 0) > 0;

            if (hasIdentity && hasArea && hasYears) {
                return '资料完整';
            }

            if (!hasIdentity && !hasArea) {
                return '待补关键信息';
            }

            return '待补资料';
        },

        getJobProfileHealthType(row) {
            const healthText = this.getJobProfileHealth(row);
            const typeMap = {
                '资料完整': 'success',
                '待补资料': 'warning',
                '待补关键信息': 'danger'
            };

            return typeMap[healthText] || 'info';
        }
    }
});

// 注册用户管理组件
Vue.component('users', {
    template: '#users-template',
    data() {
        return {
            usersData: [],
            searchText: '',
            quickStatusFilter: '',
            currentPage: 1,
            pageSize: 10,
            total: 0,
            loading: false
        };
    },
    mounted() {
        this.getUsers();
    },
    computed: {
        visibleUsersData() {
            if (this.quickStatusFilter === '') {
                return this.usersData;
            }

            return this.usersData.filter(item => String(item.status) === String(this.quickStatusFilter));
        },
        userOverviewCards() {
            const counts = this.usersData.reduce((result, item) => {
                const statusKey = Number(item.status) === 1 ? 'enabled' : 'disabled';
                result[statusKey] += 1;
                if (this.getUserProfileHealth(item) !== '资料完整') {
                    result.incomplete += 1;
                }
                return result;
            }, {
                enabled: 0,
                disabled: 0,
                incomplete: 0
            });

            return [
                {
                    title: '本页用户',
                    value: this.usersData.length,
                    desc: '当前分页已加载',
                    filterValue: ''
                },
                {
                    title: '已启用',
                    value: counts.enabled,
                    desc: '可正常预约和登录',
                    filterValue: 1
                },
                {
                    title: '已禁用',
                    value: counts.disabled,
                    desc: '建议回看禁用原因',
                    filterValue: 0
                },
                {
                    title: '资料待补',
                    value: counts.incomplete,
                    desc: '昵称或手机号缺失',
                    filterValue: ''
                }
            ];
        },
        userFocusTitle() {
            if (this.quickStatusFilter === 0) {
                return '当前正在查看受限用户';
            }

            const disabledCount = this.usersData.filter(item => Number(item.status) !== 1).length;
            if (disabledCount > 0) {
                return `本页有 ${disabledCount} 位用户处于禁用状态`;
            }

            return '本页用户状态整体平稳';
        },
        userFocusText() {
            if (this.quickStatusFilter === 0) {
                return '建议优先回看禁用用户的手机号和注册时间，判断是否需要恢复。';
            }

            return '先处理资料不完整和禁用用户，再回看预约沟通记录，能更快定位服务问题。';
        },
        userFocusFilter() {
            return this.quickStatusFilter === 0 ? '' : 0;
        }
    },
    methods: {
        // 获取用户列表
        getUsers() {
            this.loading = true;
            axios.get('/admin/user/users', {
                params: {
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    search: this.searchText
                }
            })
                .then(response => {
                    if (response.data.code === 200) {
                        this.usersData = response.data.data.users;
                        this.total = response.data.data.total;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '用户列表加载失败，请稍后重试');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 搜索用户
        searchUsers() {
            this.currentPage = 1;
            this.getUsers();
        },

        resetSearch() {
            this.searchText = '';
            this.quickStatusFilter = '';
            this.currentPage = 1;
            this.getUsers();
        },

        applyQuickStatusFilter(status = '') {
            this.quickStatusFilter = status;
        },
        
        // 切换用户状态
        toggleUserStatus(row) {
            const previousStatus = row.status;
            // 根据router.php配置，更新用户状态应该直接使用资源ID路由
            axios.put(`/admin/user/users/${row.id}`, {
                status: row.status ? 1 : 0
            })
                .then(response => {
                    if (response.data.code === 200) {
                        showActionSuccess(this, '用户状态已更新');
                    } else {
                        // 恢复原状态
                        row.status = previousStatus;
                        this.$message.error(response.data.message || '状态更新失败');
                    }
                })
                .catch(error => {
                    // 恢复原状态
                    row.status = previousStatus;
                    showActionError(this, error, '用户状态更新失败，请稍后重试');
                });
        },
        
        // 查看用户详情
        viewUser(row) {
            this.$alert(`用户ID: ${row.id}\n用户名: ${row.nickname || '-'}\n手机号: ${row.phone || '-'}\n资料状态: ${this.getUserProfileHealth(row)}\n注册时间: ${row.created_at}`, '用户详情', {
                confirmButtonText: '确定'
            });
        },

        getUserProfileHealth(row) {
            const hasNickname = Boolean(String(row.nickname || '').trim());
            const hasPhone = Boolean(String(row.phone || '').trim());

            if (hasNickname && hasPhone) {
                return '资料完整';
            }

            if (!hasNickname && !hasPhone) {
                return '待补关键信息';
            }

            return '待补资料';
        },

        getUserProfileHealthType(row) {
            const healthText = this.getUserProfileHealth(row);
            const typeMap = {
                '资料完整': 'success',
                '待补资料': 'warning',
                '待补关键信息': 'danger'
            };

            return typeMap[healthText] || 'info';
        },
        
        // 处理分页大小变化
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.getUsers();
        },
        
        // 处理当前页码变化
        handleCurrentChange(current) {
            this.currentPage = current;
            this.getUsers();
        }
    }
});

// 注册分类管理组件
Vue.component('categories', {
    template: '#categories-template',
    data() {
                return {
                    categoriesData: [],
                    loading: false,
                    addDialogVisible: false,
                    editDialogVisible: false,
                    categoryForm: {
                        name: '',
                        icon: '',
                        sort_order: 0
                    },
                    editForm: {
                        id: '',
                        name: '',
                        icon: '',
                        sort_order: 0
                    },
                    categoryRules: {
                        name: [
                            { required: true, message: '请输入分类名称', trigger: 'blur' }
                        ]
                    }
                };
    },
    mounted() {
        this.getCategories();
    },
    methods: {
        // 获取分类列表
        getCategories() {
            this.loading = true;
            axios.get('/admin/category/categories')
                .then(response => {
                    if (response.data.code === 200) {
                        // 确保categoriesData始终是一个数组
                        this.categoriesData = Array.isArray(response.data.data) ? response.data.data : [];
                    } else {
                        this.categoriesData = [];
                    }
                })
                .catch(error => {
                    showActionError(this, error, '分类列表加载失败，请稍后重试');
                    // 出错时也确保categoriesData是一个数组
                    this.categoriesData = [];
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 显示添加弹窗
        showAddDialog() {
            this.categoryForm = {
                name: '',
                icon: '',
                sort_order: 0
            };
            this.addDialogVisible = true;
        },
        
        // 添加分类
        addCategory() {
            this.$refs.categoryForm.validate((valid) => {
                if (valid) {
                    // 构造符合后端要求的数据结构
                    const categoryData = {
                        name: this.categoryForm.name,
                        icon: this.categoryForm.icon || '',
                        sort_order: this.categoryForm.sort_order || 0
                    };
                    
                    axios.post('/admin/category/categories', categoryData)
                            .then(response => {
                                if (response.data.code === 200) {
                                    showActionSuccess(this, '分类已添加');
                                    this.addDialogVisible = false;
                                    this.getCategories(); // 添加成功后刷新列表
                                } else {
                                    this.$message.error(response.data.message || '分类添加失败');
                                }
                            })
                        .catch(error => {
                            showActionError(this, error, '分类添加失败，请稍后重试');
                        });
                }
            });
        },
        
        // 显示编辑弹窗
        showEditDialog(row) {
            this.editForm = {
                id: row.id,
                name: row.name,
                icon: row.icon || '',
                sort_order: row.sort_order || 0
            };
            this.editDialogVisible = true;
        },
        
        // 更新分类
        updateCategory() {
            this.$refs.editForm.validate((valid) => {
                if (valid) {
                    // 根据router.php配置，使用RESTful风格的PUT请求
                    axios.put(`/admin/category/categories/${this.editForm.id}`, this.editForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                showActionSuccess(this, '分类已更新');
                                this.editDialogVisible = false;
                                this.getCategories();
                            } else {
                                this.$message.error(response.data.message || '分类更新失败');
                            }
                        })
                        .catch(error => {
                            showActionError(this, error, '分类更新失败，请稍后重试');
                        });
                }
            });
        },
        
        // 删除分类
        deleteCategory(id) {
            this.$confirm('确定要删除该分类吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 根据router.php配置，使用RESTful风格的DELETE请求
                axios.delete(`/admin/category/categories/${id}`)
                    .then(response => {
                        if (response.data.code === 200) {
                            showActionSuccess(this, '分类已删除');
                            this.getCategories();
                        } else {
                            this.$message.error(response.data.message || '分类删除失败');
                        }
                    })
                    .catch(error => {
                        showActionError(this, error, '分类删除失败，请稍后重试');
                    });
            }).catch(() => {
                // 用户取消
            });
        }
    }
});

// 注册服务管理组件
Vue.component('services', {
    template: '#services-template',
    data() {
        return {
            servicesData: [],
            categories: [],
            searchText: '',
            categoryId: '',
            quickStatusFilter: '',
            loading: false,
            submitting: false,
            addDialogVisible: false,
            editDialogVisible: false,
            currentPage: 1,
            pageSize: 10,
            total: 0,
            serviceForm: {
                title: '',
                category_id: '',
                price: '',
                duration: '',
                description: '',
                image_urls_text: '',
                status: 1
            },
            editForm: {
                id: '',
                title: '',
                category_id: '',
                price: '',
                duration: '',
                description: '',
                image_urls_text: '',
                status: 1
            },
            serviceRules: {
                title: [
                    { required: true, message: '请输入服务标题', trigger: 'blur' }
                ],
                category_id: [
                    { required: true, message: '请选择分类', trigger: 'change' }
                ],
                price: [
                    { required: true, message: '请输入服务价格', trigger: 'blur' },
                    { type: 'number', min: 0, message: '价格必须大于等于0', trigger: 'blur' }
                ],
                duration: [
                    { required: true, message: '请输入服务时长', trigger: 'blur' },
                    { type: 'number', min: 1, message: '时长必须大于0', trigger: 'blur' }
                ]
            }
        };
    },
    mounted() {
        this.getServices();
        this.getCategories();
    },
    computed: {
        visibleServicesData() {
            if (this.quickStatusFilter === '') {
                return this.servicesData;
            }

            return this.servicesData.filter(item => String(item.status) === String(this.quickStatusFilter));
        },
        serviceOverviewCards() {
            const pageCounts = this.servicesData.reduce((result, item) => {
                const statusKey = Number(item.status) === 1 ? 'online' : 'offline';
                const imageCount = this.getServiceImageCount(item);
                const hasDescription = Boolean(String(item.description || '').trim());

                result[statusKey] += 1;
                if (imageCount === 0 || !hasDescription) {
                    result.incomplete += 1;
                }

                return result;
            }, {
                online: 0,
                offline: 0,
                incomplete: 0
            });

            return [
                {
                    title: '当前分页',
                    value: this.servicesData.length,
                    desc: '本页已加载服务数',
                    filterValue: ''
                },
                {
                    title: '已上架',
                    value: pageCounts.online,
                    desc: '可直接在前台展示',
                    filterValue: 1
                },
                {
                    title: '已下架',
                    value: pageCounts.offline,
                    desc: '待人工确认后再上架',
                    filterValue: 0
                },
                {
                    title: '待补内容',
                    value: pageCounts.incomplete,
                    desc: '缺图片或缺简介',
                    filterValue: ''
                }
            ];
        },
        serviceFocusTitle() {
            const incompleteCount = this.servicesData.filter(item => this.getServiceHealth(item) !== '可直接投放').length;
            if (this.quickStatusFilter === 0) {
                return '当前正在查看下架服务';
            }

            if (this.quickStatusFilter === 1) {
                return '当前正在查看已上架服务';
            }

            if (incompleteCount > 0) {
                return `本页有 ${incompleteCount} 项服务建议补充内容`;
            }

            return '本页服务内容完整度表现稳定';
        },
        serviceFocusText() {
            if (this.quickStatusFilter === 0) {
                return '建议优先检查价格、简介和图片是否齐全，再决定是否恢复上架。';
            }

            if (this.quickStatusFilter === 1) {
                return '可以重点巡检已上架服务的图片和简介，避免前台展示信息不足。';
            }

            return '先处理缺图、缺简介的服务，再回看下架服务，能更快改善前台转化体验。';
        },
        serviceFocusFilter() {
            return this.quickStatusFilter === 0 ? '' : 0;
        }
    },
    methods: {
        // 获取服务列表
        getServices() {
            this.loading = true;
            axios.get('/admin/service/services', {
                params: {
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    search: this.searchText,
                    category_id: this.categoryId
                }
            })
                .then(response => {
                    if (response.data.code === 200) {
                        this.servicesData = response.data.data.list;
                        this.total = response.data.data.total;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '服务列表加载失败，请稍后重试');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 获取分类列表
        getCategories() {
            axios.get('/admin/category/categories')
                .then(response => {
                    if (response.data.code === 200) {
                        this.categories = response.data.data;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '分类数据加载失败，请稍后重试');
                });
        },
        
        // 搜索服务
        searchServices() {
            this.currentPage = 1;
            this.getServices();
        },

        resetFilters() {
            this.searchText = '';
            this.categoryId = '';
            this.quickStatusFilter = '';
            this.currentPage = 1;
            this.getServices();
        },

        applyQuickStatusFilter(status = '') {
            this.quickStatusFilter = status;
        },
        
        // 显示添加弹窗
        showAddDialog() {
            this.serviceForm = {
                title: '',
                category_id: '',
                price: '',
                duration: 60,
                description: '',
                image_urls_text: '',
                status: 1
            };
            this.addDialogVisible = true;
        },
        
        // 添加服务
        addService() {
            this.$refs.serviceForm.validate((valid) => {
                if (valid) {
                    const payload = {
                        title: this.serviceForm.title,
                        category_id: this.serviceForm.category_id,
                        price: this.serviceForm.price,
                        duration: this.serviceForm.duration,
                        description: this.serviceForm.description,
                        status: this.serviceForm.status,
                        image_urls: parseImageUrlText(this.serviceForm.image_urls_text)
                    };

                    this.submitting = true;
                    axios.post('/admin/service/services', payload)
                        .then(response => {
                            if (response.data.code === 200) {
                                showActionSuccess(this, '服务已添加');
                                this.addDialogVisible = false;
                                this.getServices();
                            } else {
                                this.$message.error(response.data.message || '服务添加失败');
                            }
                        })
                        .catch(error => {
                            showActionError(this, error, '服务添加失败，请稍后重试');
                        })
                        .finally(() => {
                            this.submitting = false;
                        });
                }
            });
        },
        
        // 显示编辑弹窗
        showEditDialog(row) {
            this.editForm = {
                id: row.id,
                title: row.title,
                category_id: row.category_id,
                price: row.price,
                duration: row.duration,
                description: row.description,
                image_urls_text: stringifyImageUrls(row.image_urls),
                status: Number(row.status) || 0
            };
            this.editDialogVisible = true;
        },

        getServiceImageCount(row) {
            return parseImageUrlText(stringifyImageUrls(row.image_urls)).length;
        },

        getServiceHealth(row) {
            const imageCount = this.getServiceImageCount(row);
            const hasDescription = Boolean(String(row.description || '').trim());

            if (!hasDescription && imageCount === 0) {
                return '待补图文';
            }

            if (!hasDescription) {
                return '待补简介';
            }

            if (imageCount === 0) {
                return '待补图片';
            }

            return '可直接投放';
        },

        getServiceHealthType(row) {
            const healthText = this.getServiceHealth(row);
            const typeMap = {
                '待补图文': 'danger',
                '待补简介': 'warning',
                '待补图片': 'warning',
                '可直接投放': 'success'
            };

            return typeMap[healthText] || 'info';
        },

        toggleServiceStatus(row, nextStatus) {
            const payload = {
                title: row.title,
                category_id: row.category_id,
                price: row.price,
                duration: row.duration,
                description: row.description,
                status: nextStatus,
                image_urls: parseImageUrlText(stringifyImageUrls(row.image_urls))
            };

            this.submitting = true;
            axios.put(`/admin/service/services/${row.id}`, payload)
                .then(response => {
                    if (response.data.code === 200) {
                        row.status = nextStatus;
                        showActionSuccess(this, `服务已${nextStatus === 1 ? '上架' : '下架'}`);
                    } else {
                        this.$message.error(response.data.message || '服务状态更新失败');
                    }
                })
                .catch(error => {
                    showActionError(this, error, '服务状态更新失败，请稍后重试');
                })
                .finally(() => {
                    this.submitting = false;
                });
        },
        
        // 更新服务
        updateService() {
            this.$refs.editForm.validate((valid) => {
                if (valid) {
                    const payload = {
                        title: this.editForm.title,
                        category_id: this.editForm.category_id,
                        price: this.editForm.price,
                        duration: this.editForm.duration,
                        description: this.editForm.description,
                        status: this.editForm.status,
                        image_urls: parseImageUrlText(this.editForm.image_urls_text)
                    };

                    this.submitting = true;
                    axios.put(`/admin/service/services/${this.editForm.id}`, payload)
                        .then(response => {
                            if (response.data.code === 200) {
                                showActionSuccess(this, '服务已更新');
                                this.editDialogVisible = false;
                                this.getServices();
                            } else {
                                this.$message.error(response.data.message || '服务更新失败');
                            }
                        })
                        .catch(error => {
                            showActionError(this, error, '服务更新失败，请稍后重试');
                        })
                        .finally(() => {
                            this.submitting = false;
                        });
                }
            });
        },
        
        // 删除服务
        deleteService(id) {
            this.$confirm('确定要删除该服务吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                axios.delete(`/admin/service/services/${id}`)
                    .then(response => {
                        if (response.data.code === 200) {
                            showActionSuccess(this, '服务已删除');
                            this.getServices();
                        } else {
                            this.$message.error(response.data.message || '服务删除失败');
                        }
                    })
                    .catch(error => {
                        showActionError(this, error, '服务删除失败，请稍后重试');
                    });
            }).catch(() => {
                // 用户取消
            });
        },
        
        // 处理分页大小变化
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.getServices();
        },
        
        // 处理当前页码变化
        handleCurrentChange(current) {
            this.currentPage = current;
            this.getServices();
        }
    }
});

// 注册预约管理组件
Vue.component('appointments', {
    template: '#appointments-template',
    data() {
        return {
            appointmentsData: [],
            searchText: '',
            status: '',
            appointmentStartDate: '',
            appointmentEndDate: '',
            loading: false,
            submitting: false,
            detailDialogVisible: false,
            statusDialogVisible: false,
            currentAppointment: null,
            currentStatus: '',
            currentAppointmentId: '',
            currentPage: 1,
            pageSize: 10,
            total: 0,
            statusMap: {
                ...APPOINTMENT_STATUS_TEXT_MAP
            },
            statusForm: {
                status: ''
            }
        };
    },
    computed: {
        availableStatusOptions() {
            const optionMap = {
                pending: [
                    { label: '已接单', value: 'accepted' },
                    { label: '已取消', value: 'cancelled' },
                    { label: '已拒绝', value: 'rejected' }
                ],
                accepted: [
                    { label: '已完成', value: 'completed' },
                    { label: '已取消', value: 'cancelled' }
                ]
            };

            return optionMap[this.currentStatus] || [];
        },
        appointmentOverviewCards() {
            const pageCounts = this.appointmentsData.reduce((result, item) => {
                const key = String(item.status || 'pending');
                result[key] = (result[key] || 0) + 1;
                return result;
            }, {});

            return [
                {
                    title: '全部预约',
                    value: this.total || 0,
                    desc: '当前筛选总量',
                    filterValue: ''
                },
                {
                    title: '待接单',
                    value: pageCounts.pending || 0,
                    desc: '建议优先跟进',
                    filterValue: 'pending'
                },
                {
                    title: '已接单',
                    value: pageCounts.accepted || 0,
                    desc: '服务准备阶段',
                    filterValue: 'accepted'
                },
                {
                    title: '异常状态',
                    value: (pageCounts.cancelled || 0) + (pageCounts.rejected || 0) + (pageCounts.no_show || 0),
                    desc: '取消、拒绝与未履约',
                    filterValue: 'cancelled'
                }
            ];
        },
        appointmentFocusTitle() {
            if (this.status === 'pending') {
                return '当前正在处理待接单预约';
            }

            if (this.status === 'accepted') {
                return '当前正在跟进已接单预约';
            }

            const pendingCount = this.appointmentsData.filter(item => item.status === 'pending').length;
            if (pendingCount > 0) {
                return `本页有 ${pendingCount} 笔预约等待处理`;
            }

            return '当前页没有待接单积压';
        },
        appointmentFocusText() {
            if (this.status === 'pending') {
                return '建议优先确认上门时间、地址和备注信息，缩短用户等待时间。';
            }

            if (this.status === 'accepted') {
                return '可以继续核对服务准备情况，及时把订单推进到完成状态。';
            }

            return '如果想快速处理最新订单，可以先切到待接单视图，再做接单和状态流转。';
        },
        appointmentFocusFilter() {
            return this.status === 'pending' ? '' : 'pending';
        },
        appointmentPipelineCards() {
            const counts = this.appointmentsData.reduce((result, item) => {
                const key = String(item.status || 'pending');
                result[key] = (result[key] || 0) + 1;
                return result;
            }, {});

            const exceptionCount = (counts.cancelled || 0) + (counts.rejected || 0) + (counts.no_show || 0);

            return [
                {
                    title: '待首轮确认',
                    value: counts.pending || 0,
                    desc: counts.pending ? '建议优先联系并确认时间、地址与备注。' : '当前没有待首轮处理积压。',
                    type: counts.pending ? 'warning' : 'success'
                },
                {
                    title: '准备执行中',
                    value: counts.accepted || 0,
                    desc: counts.accepted ? '说明已有订单进入履约准备，可继续推进完成。' : '当前没有处于执行准备阶段的订单。',
                    type: counts.accepted ? 'info' : 'plain'
                },
                {
                    title: '异常与结束',
                    value: exceptionCount,
                    desc: exceptionCount ? '建议复盘取消、拒绝和未履约原因，优化确认流程。' : '当前页异常订单较少，履约节奏相对稳定。',
                    type: exceptionCount ? 'danger' : 'success'
                }
            ];
        },
        detailActionOptions() {
            const optionMap = {
                pending: [
                    { label: '标记已接单', value: 'accepted' },
                    { label: '标记已拒绝', value: 'rejected' }
                ],
                accepted: [
                    { label: '标记已完成', value: 'completed' },
                    { label: '标记已取消', value: 'cancelled' }
                ]
            };

            return optionMap[String(this.currentAppointment?.status || '')] || [];
        },
        currentAppointmentGuide() {
            const status = String(this.currentAppointment?.status || '');
            const guideMap = {
                pending: '建议先确认用户时间、地址和备注，再决定接单或拒绝。',
                accepted: '当前订单已进入执行准备阶段，完成服务后可直接更新状态。',
                completed: '该订单已经闭环完成，可作为复盘服务体验的参考。',
                cancelled: '该订单已取消，建议关注取消原因并优化确认流程。',
                rejected: '该订单未被受理，建议回看时间和备注信息是否存在不匹配。',
                no_show: '该订单未履约，建议线下复盘沟通和履约节点。'
            };

            return guideMap[status] || '在这里可以集中查看预约信息和下一步处理建议。';
        },
        currentAppointmentActionTitle() {
            const status = String(this.currentAppointment?.status || '');
            const titleMap = {
                pending: '当前最重要的是尽快给用户明确反馈',
                accepted: '当前最重要的是把订单推进到履约完成',
                completed: '当前最重要的是把它当作已闭环样本复盘',
                cancelled: '当前最重要的是判断取消是否源于确认流程问题',
                rejected: '当前最重要的是回看是否存在需求不匹配',
                no_show: '当前最重要的是复盘履约中断节点'
            };

            return titleMap[status] || '当前最重要的是先判断这笔订单所处阶段';
        },
        currentAppointmentActionDesc() {
            const status = String(this.currentAppointment?.status || '');
            const descMap = {
                pending: '如果用户预约时间临近，建议优先处理，避免等待感过强影响转化体验。',
                accepted: '建议再核对服务地址、联系人和备注，减少执行前反复沟通。',
                completed: '可用来观察哪些服务更容易顺利闭环，辅助后续优化首页推荐和服务描述。',
                cancelled: '如果取消集中出现，通常值得回看时间确认、上门范围说明是否不够清楚。',
                rejected: '如果拒绝较多，建议复盘服务承接范围、服务详情表达和预约前提示是否不足。',
                no_show: '未履约订单适合重点复盘，通常最能暴露确认、沟通或排班问题。'
            };

            return descMap[status] || '结合订单详情判断下一步动作，避免只做状态流转。';
        }
    },
    mounted() {
        this.getAppointments();
    },
    methods: {
        // 获取预约列表
        getAppointments() {
            this.loading = true;
            axios.get('/admin/appointment/appointments', {
                params: {
                    page: this.currentPage,
                    pageSize: this.pageSize,
                    search: this.searchText,
                    status: this.status,
                    start_date: this.appointmentStartDate,
                    end_date: this.appointmentEndDate
                }
            })
                .then(response => {
                    if (response.data.code === 200) {
                        // 对获取的预约列表数据进行处理，确保status字段格式统一
                        this.appointmentsData = response.data.data.list.map(appointment => {
                            // 确保status是字符串格式
                            appointment.status = String(appointment.status);
                            return appointment;
                        });
                        this.total = response.data.data.total;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '预约列表加载失败，请稍后重试');
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 搜索预约
        searchAppointments() {
            if (this.appointmentStartDate && this.appointmentEndDate && this.appointmentStartDate > this.appointmentEndDate) {
                this.$message.warning('开始日期不能晚于结束日期');
                return;
            }

            this.currentPage = 1;
            this.getAppointments();
        },

        resetFilters() {
            this.searchText = '';
            this.status = '';
            this.appointmentStartDate = '';
            this.appointmentEndDate = '';
            this.currentPage = 1;
            this.getAppointments();
        },

        applyStatusFilter(status = '') {
            if (this.status === status) {
                this.searchAppointments();
                return;
            }

            this.status = status;
            this.currentPage = 1;
            this.getAppointments();
        },
        
        // 查看预约详情
        viewAppointment(row) {
            axios.get(`/admin/appointment/appointments/${row.id}`)
                .then(response => {
                    if (response.data.code === 200) {
                        this.currentAppointment = {
                            ...response.data.data,
                            status: String(response.data.data.status || '')
                        };
                        this.detailDialogVisible = true;
                    }
                })
                .catch(error => {
                    showActionError(this, error, '预约详情加载失败，请稍后重试');
                });
        },
        
        // 显示更新状态弹窗
        updateAppointmentStatus(id, status) {
            this.currentAppointmentId = id;
            this.currentStatus = String(status);
            this.statusForm.status = '';
            this.statusDialogVisible = true;
        },

        quickUpdateAppointmentStatus(row, nextStatus, keepDialogOpen = false) {
            if (!row?.id || !nextStatus) {
                return;
            }

            this.submitting = true;
            axios.put(`/admin/appointment/appointments/${row.id}`, {
                status: nextStatus
            })
                .then(response => {
                    if (response.data.code === 200) {
                        const previousStatus = row.status;
                        row.status = nextStatus;

                        if (this.currentAppointment && String(this.currentAppointment.id) === String(row.id)) {
                            this.currentAppointment = {
                                ...this.currentAppointment,
                                status: nextStatus
                            };
                        }

                        showActionSuccess(this, `预约已更新为${this.formatStatus({ status: nextStatus })}`);

                        if (!keepDialogOpen) {
                            this.detailDialogVisible = false;
                        }

                        if (this.status && this.status !== nextStatus && this.status === previousStatus) {
                            this.getAppointments();
                        }
                    } else {
                        this.$message.error(response.data.message || '预约状态更新失败');
                    }
                })
                .catch(error => {
                    showActionError(this, error, '预约状态更新失败，请稍后重试');
                })
                .finally(() => {
                    this.submitting = false;
                });
        },
        
        // 确认更新状态
        confirmUpdateStatus() {
            if (!this.statusForm.status) {
                this.$message.warning('请选择新状态');
                return;
            }
            
            this.submitting = true;
            axios.put(`/admin/appointment/appointments/${this.currentAppointmentId}`, {
                status: this.statusForm.status
            })
                .then(response => {
                    if (response.data.code === 200) {
                        showActionSuccess(this, '预约状态已更新');
                        this.statusDialogVisible = false;
                        this.getAppointments();
                    } else {
                        this.$message.error(response.data.message || '状态更新失败');
                    }
                })
                .catch(error => {
                    showActionError(this, error, '预约状态更新失败，请稍后重试');
                })
                .finally(() => {
                    this.submitting = false;
                });
        },
        
        // 格式化状态
        formatStatus(row) {
            return APPOINTMENT_STATUS_TEXT_MAP[row.status] || row.status;
        },
        getAppointmentOpsHint(row) {
            const map = {
                pending: '优先确认时间和地址，尽快给用户明确反馈。',
                accepted: '继续跟进入场准备，避免服务前信息缺失。',
                completed: '可作为顺利履约样本回看服务闭环。',
                cancelled: '关注取消原因，判断是否需要优化确认流程。',
                rejected: '回看需求与服务承接是否匹配。',
                no_show: '复盘履约中断节点，避免重复发生。'
            };

            return map[String(row.status || '')] || '查看详情并判断下一步处理动作。';
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
        },
        
        // 处理分页大小变化
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
            this.getAppointments();
        },
        
        // 处理当前页码变化
        handleCurrentChange(current) {
            this.currentPage = current;
            this.getAppointments();
        }
    }
});

// 注册管理员管理组件
Vue.component('admins', {
    template: '#admins-template',
    data() {
        return {
            adminsData: [],
            currentAdminId: '',
            loading: false,
            submitting: false,
            addDialogVisible: false,
            editDialogVisible: false,
            adminForm: {
                username: '',
                password: '',
                role: 1,
                status: 1
            },
            editForm: {
                id: '',
                username: '',
                password: '',
                role: 1,
                status: 1
            },
            adminRules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' },
                    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
                ]
            },
            editRules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ]
            }
        };
    },
    mounted() {
        this.getAdmins();
        this.getCurrentAdmin();
    },
    methods: {
        // 获取管理员列表
        getAdmins() {
            this.loading = true;
            axios.get('/admin/admin/admins')
                .then(response => {
                    if (response.data.code === 200) {
                        // 确保adminsData始终是一个数组
                        this.adminsData = Array.isArray(response.data.data) ? response.data.data : [];
                    } else {
                        // 非200状态码时也设置为空数组
                        this.adminsData = [];
                    }
                })
                .catch(error => {
                    showActionError(this, error, '管理员列表加载失败，请稍后重试');
                    // 出错时确保adminsData是一个数组
                    this.adminsData = [];
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        
        // 获取当前管理员信息
        getCurrentAdmin() {
            axios.get('/admin/admin/profile')
                .then(response => {
                    if (response.data.code === 200) {
                        this.currentAdminId = response.data.data.id;
                    } else {
                        // 处理非200状态码的情况
                        this.currentAdminId = '';
                    }
                })
                .catch(error => {
                    console.error('获取当前管理员信息失败:', error);
                    // 出错时设置默认值
                    this.currentAdminId = '';
                });
        },
        
        // 显示添加弹窗
        showAddDialog() {
            this.adminForm = {
                username: '',
                password: '',
                role: 1,
                status: 1
            };
            this.addDialogVisible = true;
        },
        
        // 添加管理员
        addAdmin() {
            this.$refs.adminForm.validate((valid) => {
                if (valid) {
                    this.submitting = true;
                    axios.post('/admin/admin/admins', this.adminForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                showActionSuccess(this, '管理员已添加');
                                this.addDialogVisible = false;
                                this.getAdmins();
                            } else {
                                this.$message.error(response.data.message || '管理员添加失败');
                            }
                        })
                        .catch(error => {
                            showActionError(this, error, '管理员添加失败，请稍后重试');
                        })
                        .finally(() => {
                            this.submitting = false;
                        });
                }
            });
        },
        
        // 显示编辑弹窗
        showEditDialog(row) {
            this.editForm = {
                id: row.id,
                username: row.username,
                password: '',
                role: Number(row.role) || 1,
                status: Number(row.status) || 0
            };
            this.editDialogVisible = true;
        },
        
        // 更新管理员
        updateAdmin() {
            this.$refs.editForm.validate((valid) => {
                if (valid) {
                    // 如果密码为空，不发送密码字段
                    const updateData = { ...this.editForm };
                    if (!updateData.password) {
                        delete updateData.password;
                    }

                    this.submitting = true;
                    axios.put(`/admin/admin/admins/${this.editForm.id}`, updateData)
                        .then(response => {
                            if (response.data.code === 200) {
                                showActionSuccess(this, '管理员已更新');
                                this.editDialogVisible = false;
                                this.getAdmins();
                            } else {
                                this.$message.error(response.data.message || '管理员更新失败');
                            }
                        })
                        .catch(error => {
                            showActionError(this, error, '管理员更新失败，请稍后重试');
                        })
                        .finally(() => {
                            this.submitting = false;
                        });
                }
            });
        },
        
        // 删除管理员
        deleteAdmin(id) {
            if (String(id) === String(this.currentAdminId)) {
                this.$message.warning('不能删除当前登录的管理员账号');
                return;
            }

            this.$confirm('确定要删除该管理员吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                axios.delete(`/admin/admin/admins/${id}`)
                    .then(response => {
                        if (response.data.code === 200) {
                            showActionSuccess(this, '管理员已删除');
                            this.getAdmins();
                        } else {
                            this.$message.error(response.data.message || '管理员删除失败');
                        }
                    })
                    .catch(error => {
                        showActionError(this, error, '管理员删除失败，请稍后重试');
                    });
            }).catch(() => {
                // 用户取消
            });
        }
    }
});
