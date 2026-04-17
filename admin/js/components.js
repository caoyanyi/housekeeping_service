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
            this.currentPage = 1;
            this.getJobApplications();
        },
        
        // 查看求职申请详情
        viewJobApplication(row) {
            axios.get(`/admin/job/application/applications/${row.id}`)
                .then(response => {
                    if (response.data.code === 200) {
                        this.viewForm = response.data.data.data;
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
            currentPage: 1,
            pageSize: 10,
            total: 0,
            loading: false
        };
    },
    mounted() {
        this.getUsers();
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
            this.currentPage = 1;
            this.getUsers();
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
            this.$alert(`用户ID: ${row.id}\n用户名: ${row.nickname}\n手机号: ${row.phone}\n注册时间: ${row.created_at}`, '用户详情', {
                confirmButtonText: '确定'
            });
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
            this.currentPage = 1;
            this.getServices();
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
