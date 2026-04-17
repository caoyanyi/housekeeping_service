# 家政服务系统

一个包含用户端、管理端和 PHP API 的家政服务项目，覆盖服务浏览、在线预约、个人资料维护、后台管理和求职报名等核心场景。

## 项目结构

```text
.
├── admin/      管理端，基于 Vue 2 + Element UI + Axios
├── api/        后端接口，基于原生 PHP + PDO
├── client/     用户端，基于 uni-app
├── database/   数据结构和初始化脚本
└── *.md        部署、邮件配置等说明文档
```

## 当前能力

### 用户端
- 手机号注册、登录
- 首页服务推荐与分类导航
- 服务列表筛选与搜索
- 服务详情查看与预约下单
- 我的预约列表、详情、取消预约
- 个人中心与账户设置
- 家政从业者求职报名

### 管理端
- 管理员登录与仪表盘
- 用户管理
- 分类管理
- 服务管理
- 预约管理
- 求职申请管理
- 管理员管理

### API
- 用户、管理员 JWT 鉴权
- 服务、分类、预约 REST 风格接口
- 求职申请提交与后台管理
- 可选邮件通知

## 技术说明

### 后端
- 语言：PHP 7.4+
- 数据库：MySQL 5.7+ / 8.0
- 依赖：`phpmailer/phpmailer`
- 入口文件：[api/index.php](/data/github/housekeeping_service/api/index.php)

### 用户端
- 框架：uni-app
- 入口文件：[client/main.js](/data/github/housekeeping_service/client/main.js)
- 接口配置：[client/config/api.config.js](/data/github/housekeeping_service/client/config/api.config.js)

### 管理端
- Vue 2 + Element UI
- 入口文件：[admin/index.html](/data/github/housekeeping_service/admin/index.html)
- 主逻辑：[admin/js/main.js](/data/github/housekeeping_service/admin/js/main.js)

## 快速启动

### 1. 安装 PHP 依赖

```bash
composer install
```

### 2. 初始化数据库

```bash
mysql -u root -p housekeeping_service < database/structure.sql
mysql -u root -p housekeeping_service < database/init_data.sql
```

### 3. 修改后端配置

编辑 [api/config/config.php](/data/github/housekeeping_service/api/config/config.php)：

```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'housekeeping_service');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');

define('JWT_SECRET', 'replace_with_a_strong_secret');
define('API_URL', 'https://your-domain.com/api');
```

生产环境建议同时调整：

- `DEBUG_MODE` 改为 `false`
- `DEBUG_DISPLAY_ERRORS` 改为 `false`
- 配置真实邮件服务参数

### 4. 启动访问

- 管理端：部署 `admin/` 目录到 Web 服务器
- API：将请求转发到 `api/index.php`
- 用户端：用 HBuilderX 打开 `client/` 进行编译运行

## API 地址配置

为了减少部署时改代码的成本，用户端和管理端都支持动态 API 地址：

### 管理端

默认取值顺序：

1. `window.__API_BASE_URL__`
2. `localStorage.adminApiBaseURL`
3. `当前域名 + /api`

### 用户端

默认取值顺序：

1. `window.__API_BASE_URL__`
2. `uni.getStorageSync('apiBaseURL')`
3. H5 环境下 `当前域名 + /api`
4. 最后的线上兜底地址

## 主要接口

### 用户
- `POST /api/user/register`
- `POST /api/user/login`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `PUT /api/user/change-password`

### 服务与分类
- `GET /api/category/categories`
- `GET /api/service/services`
- `GET /api/service/services/{id}`

### 预约
- `GET /api/appointment/appointments`
- `POST /api/appointment/appointments`
- `GET /api/appointment/appointments/{id}`
- `DELETE /api/appointment/appointments/{id}`

### 管理端
- `POST /api/admin/admin/login`
- `GET /api/admin/admin/profile`
- `GET /api/admin/admin/dashboard`
- `GET /api/admin/user/users`
- `GET /api/admin/category/categories`
- `GET /api/admin/service/services`
- `GET /api/admin/appointment/appointments`
- `GET /api/admin/job/application/applications`

## 默认账号

初始化数据中通常包含管理员账号：

- 用户名：`admin`
- 密码：`123456`

首次部署后请立即修改密码。

## 最近已完成的优化

- 补齐用户端、管理端的接口地址动态配置
- 修正管理员和普通用户鉴权边界
- 修复用户资料更新参数顺序错误
- 增加预约详情越权校验和预约时间合法性校验
- 优化用户端登录回跳、设置页和预约提交流程
- 修复管理端获取管理员资料的错误接口调用

## 说明

- 当前仓库不是基于完整前端工程化脚手架搭建的管理端项目，管理端以静态页面方式运行。
- 如果继续扩展，优先建议补自动化测试、统一接口文档和上传能力。
