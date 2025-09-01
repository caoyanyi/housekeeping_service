// 注册用户管理组件
Vue.component('users', {
    template: '#users-template',
    data() {
        return {
            usersData: [],
            searchText: '',
            currentPage: 1,
            pageSize: 10,
            total: 0
        };
    },
    mounted() {
        this.getUsers();
    },
    methods: {
        // 获取用户列表
        getUsers() {
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
                    console.error('获取用户列表失败:', error);
                    this.$message.error('获取用户列表失败');
                });
        },
        
        // 搜索用户
        searchUsers() {
            this.currentPage = 1;
            this.getUsers();
        },
        
        // 切换用户状态
        toggleUserStatus(row) {
            // 根据router.php配置，更新用户状态应该直接使用资源ID路由
            axios.put(`/admin/user/users/${row.id}`, {
                status: row.status ? 1 : 0
            })
                .then(response => {
                    if (response.data.code === 200) {
                        this.$message.success('状态更新成功');
                    } else {
                        // 恢复原状态
                        row.status = !row.status;
                        this.$message.error(response.data.message || '状态更新失败');
                    }
                })
                .catch(error => {
                    console.error('更新用户状态失败:', error);
                    // 恢复原状态
                    row.status = !row.status;
                    this.$message.error('状态更新失败');
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
                    console.error('获取分类列表失败:', error);
                    this.$message.error('获取分类列表失败');
                    // 出错时也确保categoriesData是一个数组
                    this.categoriesData = [];
                });
        },
        
        // 显示添加弹窗
        showAddDialog() {
            this.categoryForm = {
                name: '',
                description: ''
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
                                    this.$message.success('分类添加成功');
                                    this.addDialogVisible = false;
                                    this.getCategories(); // 添加成功后刷新列表
                                } else {
                                    this.$message.error(response.data.message || '分类添加失败');
                                }
                            })
                        .catch(error => {
                            console.error('添加分类失败:', error);
                            this.$message.error('分类添加失败');
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
                console.log('editForm:', this.editForm);
                if (valid) {
                    // 根据router.php配置，使用RESTful风格的PUT请求
                    axios.put(`/admin/category/categories/${this.editForm.id}`, this.editForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('分类更新成功');
                                this.editDialogVisible = false;
                                this.getCategories();
                            } else {
                                this.$message.error(response.data.message || '分类更新失败');
                            }
                        })
                        .catch(error => {
                            console.error('更新分类失败:', error);
                            this.$message.error('分类更新失败');
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
                            this.$message.success('分类删除成功');
                            this.getCategories();
                        } else {
                            this.$message.error(response.data.message || '分类删除失败');
                        }
                    })
                    .catch(error => {
                        console.error('删除分类失败:', error);
                        this.$message.error('分类删除失败');
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
                content: '',
                provider: '',
                image_urls: []
            },
            editForm: {
                id: '',
                title: '',
                category_id: '',
                price: '',
                duration: '',
                description: '',
                content: '',
                provider: ''
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
                    console.error('获取服务列表失败:', error);
                    this.$message.error('获取服务列表失败');
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
                    console.error('获取分类列表失败:', error);
                });
        },
        
        // 搜索服务
        searchServices() {
            this.currentPage = 1;
            this.getServices();
        },
        
        // 显示添加弹窗
        showAddDialog() {
            this.serviceForm = {
                title: '',
                category_id: '',
                price: '',
                duration: '',
                description: '',
                content: '',
                provider: '',
                image_urls: []
            };
            this.addDialogVisible = true;
        },
        
        // 处理图片变化
        handleImageChange(file, fileList) {
            this.serviceForm.image_urls = fileList;
        },
        
        // 处理图片移除
        handleImageRemove(file, fileList) {
            this.serviceForm.image_urls = fileList;
        },
        
        // 添加服务
        addService() {
            this.$refs.serviceForm.validate((valid) => {
                if (valid) {
                    // 模拟图片上传，实际项目中应该上传图片到服务器
                    const formData = new FormData();
                    Object.keys(this.serviceForm).forEach(key => {
                        if (key === 'image_urls') {
                            // 处理图片
                            this.serviceForm.image_urls.forEach(file => {
                                formData.append('image_urls[]', file.raw);
                            });
                        } else {
                            formData.append(key, this.serviceForm[key]);
                        }
                    });
                    
                    // 由于是模拟环境，这里使用简化的请求
                    axios.post('/admin/service/services', this.serviceForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('服务添加成功');
                                this.addDialogVisible = false;
                                this.getServices();
                            } else {
                                this.$message.error(response.data.message || '服务添加失败');
                            }
                        })
                        .catch(error => {
                            console.error('添加服务失败:', error);
                            this.$message.error('服务添加失败');
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
                content: row.content,
                provider: row.provider
            };
            this.editDialogVisible = true;
        },
        
        // 更新服务
        updateService() {
            this.$refs.editForm.validate((valid) => {
                if (valid) {
                    axios.put(`/admin/service/services/${this.editForm.id}`, this.editForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('服务更新成功');
                                this.editDialogVisible = false;
                                this.getServices();
                            } else {
                                this.$message.error(response.data.message || '服务更新失败');
                            }
                        })
                        .catch(error => {
                            console.error('更新服务失败:', error);
                            this.$message.error('服务更新失败');
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
                            this.$message.success('服务删除成功');
                            this.getServices();
                        } else {
                            this.$message.error(response.data.message || '服务删除失败');
                        }
                    })
                    .catch(error => {
                        console.error('删除服务失败:', error);
                        this.$message.error('服务删除失败');
                    });
            }).catch(() => {
                // 用户取消
            });
        },
        
        // 处理分页大小变化
        handleSizeChange(size) {
            this.pageSize = size;
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
            detailDialogVisible: false,
            statusDialogVisible: false,
            currentAppointment: null,
            currentStatus: '',
            currentAppointmentId: '',
            currentPage: 1,
            pageSize: 10,
            total: 0,
            statusMap: {
                'pending': '待接单',
                'accepted': '已接单',
                'completed': '已完成',
                'cancelled': '已取消',
                'rejected': '已拒绝'
            },
            statusForm: {
                status: ''
            }
        };
    },
    mounted() {
        this.getAppointments();
    },
    methods: {
        // 获取预约列表
        getAppointments() {
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
                    console.error('获取预约列表失败:', error);
                    this.$message.error('获取预约列表失败');
                });
        },
        
        // 搜索预约
        searchAppointments() {
            this.currentPage = 1;
            this.getAppointments();
        },
        
        // 查看预约详情
        viewAppointment(row) {
            axios.get(`/admin/appointment/appointments/${row.id}`)
                .then(response => {
                    if (response.data.code === 200) {
                        this.currentAppointment = response.data.data;
                        this.detailDialogVisible = true;
                    }
                })
                .catch(error => {
                    console.error('获取预约详情失败:', error);
                    this.$message.error('获取预约详情失败');
                });
        },
        
        // 显示更新状态弹窗
        updateAppointmentStatus(id, status) {
            this.currentAppointmentId = id;
            
            this.currentStatus = status;
            
            // 重置表单状态
            this.statusForm.status = '';
            
            // 确保statusDialogVisible先设为false再设为true，强制重新渲染
            this.statusDialogVisible = false;
            
            // 使用setTimeout和$nextTick确保Vue正确更新DOM
            setTimeout(() => {
                this.$nextTick(() => {
                    this.statusDialogVisible = true;
                    
                    // 直接操作DOM以确保弹窗显示
                    if (this.$el && !document.querySelector('.el-dialog__wrapper')) {
                        console.warn('弹窗DOM元素未找到，尝试强制刷新视图');
                        // 强制触发视图更新
                        this.$forceUpdate();
                    }
                });
            }, 100);
        },
        
        // 确认更新状态
        confirmUpdateStatus() {
            if (!this.statusForm.status) {
                this.$message.warning('请选择新状态');
                return;
            }
            
            // 根据router.php配置，更新预约状态可以直接使用资源ID路由
            axios.put(`/admin/appointment/appointments/${this.currentAppointmentId}`, {
                status: this.statusForm.status
            })
                .then(response => {
                    if (response.data.code === 200) {
                        this.$message.success('状态更新成功');
                        this.statusDialogVisible = false;
                        this.getAppointments();
                    } else {
                        this.$message.error(response.data.message || '状态更新失败');
                    }
                })
                .catch(error => {
                    console.error('更新预约状态失败:', error);
                    this.$message.error('状态更新失败');
                });
        },
        
        // 格式化状态
        formatStatus(row) {
            return this.statusMap[row.status] || row.status;
        },
        
        // 处理分页大小变化
        handleSizeChange(size) {
            this.pageSize = size;
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
            addDialogVisible: false,
            editDialogVisible: false,
            adminForm: {
                username: '',
                password: ''
            },
            editForm: {
                id: '',
                username: '',
                password: ''
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
                    console.error('获取管理员列表失败:', error);
                    this.$message.error('获取管理员列表失败');
                    // 出错时确保adminsData是一个数组
                    this.adminsData = [];
                });
        },
        
        // 获取当前管理员信息
        getCurrentAdmin() {
            // 根据router.php配置，使用/user/profile路由获取当前登录用户信息（基于token）
            axios.get('/user/profile')
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
                password: ''
            };
            this.addDialogVisible = true;
        },
        
        // 添加管理员
        addAdmin() {
            this.$refs.adminForm.validate((valid) => {
                if (valid) {
                    axios.post('/admin/admin/admins', this.adminForm)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('管理员添加成功');
                                this.addDialogVisible = false;
                                this.getAdmins();
                            } else {
                                this.$message.error(response.data.message || '管理员添加失败');
                            }
                        })
                        .catch(error => {
                            console.error('添加管理员失败:', error);
                            this.$message.error('管理员添加失败');
                        });
                }
            });
        },
        
        // 显示编辑弹窗
        showEditDialog(row) {
            this.editForm = {
                id: row.id,
                username: row.username,
                password: ''
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
                    
                    axios.put(`/admin/admin/admins/${this.editForm.id}`, updateData)
                        .then(response => {
                            if (response.data.code === 200) {
                                this.$message.success('管理员更新成功');
                                this.editDialogVisible = false;
                                this.getAdmins();
                            } else {
                                this.$message.error(response.data.message || '管理员更新失败');
                            }
                        })
                        .catch(error => {
                            console.error('更新管理员失败:', error);
                            this.$message.error('管理员更新失败');
                        });
                }
            });
        },
        
        // 删除管理员
        deleteAdmin(id) {
            this.$confirm('确定要删除该管理员吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                axios.delete(`/admin/admin/admins/${id}`)
                    .then(response => {
                        if (response.data.code === 200) {
                            this.$message.success('管理员删除成功');
                            this.getAdmins();
                        } else {
                            this.$message.error(response.data.message || '管理员删除失败');
                        }
                    })
                    .catch(error => {
                        console.error('删除管理员失败:', error);
                        this.$message.error('管理员删除失败');
                    });
            }).catch(() => {
                // 用户取消
            });
        }
    }
});