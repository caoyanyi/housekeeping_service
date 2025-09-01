# 家政服务系统

## 项目介绍
这是一个完整的家政服务系统，包含用户端（基于uni-app）、管理端（基于Vue.js+Element UI）和后端API（基于PHP）。系统实现了用户注册登录、服务浏览、在线预约、个人中心管理等功能，以及管理员对用户、服务、分类、预约和系统管理员的全面管理。

## 系统架构

### 目录结构
```
├── admin/             # 管理端应用
│   ├── css/           # 样式文件
│   ├── index.html     # 入口文件
│   └── js/            # JavaScript文件
├── api/               # 后端API
│   ├── config/        # 配置文件
│   ├── controllers/   # 控制器
│   ├── index.php      # API入口
│   ├── models/        # 数据模型
│   ├── routes/        # 路由配置
│   └── utils/         # 工具类
├── client-uniapp/     # 用户端应用（uni-app）
│   ├── App.vue        # 应用根组件
│   ├── common/        # 公共资源
│   ├── pages/         # 页面组件
│   └── pages.json     # 页面配置
└── database/          # 数据库脚本
```

## 环境要求

### 服务器环境
- PHP 7.0+（推荐7.4或更高版本）
- MySQL 5.6+（推荐8.0）
- Apache/Nginx 服务器
- 支持SSL（可选，建议生产环境使用）

### 客户端环境
- 微信开发者工具（用于小程序开发）
- HBuilderX（用于uni-app开发）
- 现代浏览器（Chrome/Firefox/Edge，用于管理端访问）

## 部署步骤

### 1. 准备数据库

1. 创建数据库：
```sql
CREATE DATABASE `jiazheng` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：
```bash
mysql -u root -p jiazheng < database/structure.sql
mysql -u root -p jiazheng < database/admin_structure.sql
```

3. 导入初始数据：
```bash
mysql -u root -p jiazheng < database/init_data.sql
mysql -u root -p jiazheng < database/admin_init_data.sql
```

### 2. 配置API服务

1. 编辑`api/config/config.php`文件，根据您的环境配置数据库连接信息和JWT密钥：
```php
// 数据库配置
'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'username' => 'root',
    'password' => 'your_password',
    'database' => 'jiazheng',
    'charset' => 'utf8mb4'
],

// JWT配置
'jwt' => [
    'secret' => 'your_secret_key', // 建议使用随机生成的32位字符串
    'expire' => 86400 // 令牌有效期（秒）
]
```

2. 配置Web服务器：
   - Apache：确保启用了mod_rewrite模块，并设置了正确的DocumentRoot指向api目录
   - Nginx：配置正确的root路径和rewrite规则

### 3. 部署管理端

1. 将`admin`目录部署到Web服务器上
2. 编辑`admin/js/main.js`中的API基础URL：
```javascript
// 设置API基础URL
axios.defaults.baseURL = 'https://your-api-domain.com/api';
```

### 4. 部署用户端（uni-app）

1. 使用HBuilderX打开`client-uniapp`目录
2. 在App.vue或全局配置文件中设置API基础URL
3. 编译打包为微信小程序、H5或其他平台应用

## 配置文件说明

### 后端API配置（api/config/config.php）
包含数据库连接信息、JWT密钥、上传设置等系统核心配置。请根据您的实际环境进行修改，特别是数据库连接信息和JWT密钥。

### 管理端配置（admin/js/main.js）
设置API请求的基础URL、请求拦截器和响应拦截器，用于处理身份验证和错误处理。

### 用户端配置（client-uniapp/App.vue）
配置全局样式、API基础URL和全局变量。

## 管理员账号

系统初始管理员账号：
- 用户名：admin
- 密码：123456

**注意：首次登录后请立即修改密码！**

## 系统功能

### 用户端功能
1. 用户注册/登录
2. 浏览首页服务推荐
3. 查看服务分类和服务列表
4. 查看服务详情并预约
5. 查看和管理我的预约
6. 个人信息管理

### 管理端功能
1. 用户管理（查看、搜索、禁用/启用）
2. 分类管理（增删改查）
3. 服务管理（增删改查、上下架）
4. 预约管理（查看、搜索、处理状态）
5. 管理员管理（增删改查、权限管理）

## API接口文档

### 用户相关接口
- POST /api/user/register - 用户注册
- POST /api/user/login - 用户登录
- GET /api/user/profile - 获取用户信息
- PUT /api/user/profile - 更新用户信息
- PUT /api/user/password - 修改密码

### 服务相关接口
- GET /api/service - 获取服务列表
- GET /api/service/{id} - 获取服务详情
- GET /api/category - 获取分类列表

### 预约相关接口
- POST /api/appointment - 创建预约
- GET /api/appointment - 获取预约列表
- GET /api/appointment/{id} - 获取预约详情
- PUT /api/appointment/{id}/cancel - 取消预约

### 管理员相关接口
- POST /api/admin/login - 管理员登录
- GET /api/admin - 获取管理员列表
- POST /api/admin - 添加管理员
- PUT /api/admin/{id} - 更新管理员
- DELETE /api/admin/{id} - 删除管理员

## 使用说明

### 用户端使用
1. 打开应用，注册或登录账号
2. 在首页浏览推荐服务或通过分类查找服务
3. 选择服务查看详情，点击预约按钮进行预约
4. 在个人中心查看预约记录和管理个人信息

### 管理端使用
1. 打开管理端网址
2. 使用管理员账号登录
3. 在左侧菜单选择相应功能模块进行管理
4. 根据页面提示进行操作

## 注意事项

1. 请确保数据库配置正确，否则系统无法正常连接数据库
2. 生产环境请修改JWT密钥为强密钥，定期更换
3. 建议使用HTTPS协议部署，保障数据传输安全
4. 定期备份数据库，防止数据丢失
5. 管理员账号请妥善保管，避免泄露
6. 如遇问题，请检查服务器日志和API请求日志进行排查