# 部署说明

本文档按当前仓库的真实代码结构整理，适用于把 `admin/`、`api/` 和 `client/` 分别部署到测试或生产环境。

## 1. 环境要求

### 服务端
- PHP 7.4 或更高
- MySQL 5.7 或更高
- Nginx / Apache
- Composer

### 客户端
- 管理端可直接通过静态文件方式部署
- 用户端使用 HBuilderX 或 uni-app 对应构建工具打包

## 2. 初始化数据库

创建数据库：

```sql
CREATE DATABASE `housekeeping_service`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

导入数据：

```bash
mysql -u root -p housekeeping_service < database/structure.sql
mysql -u root -p housekeeping_service < database/init_data.sql
```

## 3. 安装后端依赖

在项目根目录执行：

```bash
composer install
```

## 4. 配置后端

编辑 [api/config/config.php](/data/github/housekeeping_service/api/config/config.php)：

```php
define('DEBUG_MODE', false);
define('DEBUG_DISPLAY_ERRORS', false);

define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'housekeeping_service');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');

define('JWT_SECRET', 'replace_with_random_secret');
define('API_URL', 'https://api.example.com/api');

define('MAIL_HOST', 'smtp.example.com');
define('MAIL_PORT', 465);
define('MAIL_USERNAME', 'your_email@example.com');
define('MAIL_PASSWORD', 'smtp_password');
define('MAIL_FROM_ADDRESS', 'your_email@example.com');
```

生产环境建议：

- 关闭调试输出
- 使用强 JWT 密钥
- 配置 HTTPS
- 为日志目录授予写权限

## 5. 部署 API

推荐将 `api/` 作为接口根目录部署，并把所有请求转发到 `api/index.php`。

### Nginx 示例

```nginx
server {
    listen 80;
    server_name api.example.com;

    root /var/www/housekeeping_service/api;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
    }
}
```

### Apache 要点

- 开启 `mod_rewrite`
- `DocumentRoot` 指向 `api/`
- 所有接口请求进入 `index.php`

## 6. 部署管理端

将 `admin/` 目录作为静态站点部署即可，例如：

```bash
/var/www/housekeeping_service/admin
```

管理端 API 地址默认规则：

1. `window.__API_BASE_URL__`
2. `localStorage.adminApiBaseURL`
3. `当前域名 + /api`

如果管理端与 API 不同域，可以在页面加载前注入：

```html
<script>
  window.__API_BASE_URL__ = 'https://api.example.com/api';
</script>
```

## 7. 部署用户端

用 HBuilderX 打开 `client/` 后进行平台构建。

用户端 API 地址默认规则：

1. `window.__API_BASE_URL__`
2. `uni.getStorageSync('apiBaseURL')`
3. H5 环境下 `当前域名 + /api`
4. 代码中的线上兜底地址

如果是 H5 部署，建议直接通过 `window.__API_BASE_URL__` 注入生产接口地址。

## 8. 跨域说明

[api/index.php](/data/github/housekeeping_service/api/index.php) 中维护了可信来源列表。若前端域名发生变化，需要同步更新：

- `http://localhost:8000`
- `http://127.0.0.1:8000`
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- 以及你的实际线上域名

如果管理端和 API 分域部署，请务必把实际来源加入白名单。

## 9. 上线前检查

- 能正常登录管理员后台
- 用户端可以注册、登录、浏览服务、提交预约
- 管理端可以查看分类、服务、预约、求职申请
- 用户只能查看自己的预约详情
- 邮件配置开启后，预约和求职流程通知正常
- 默认管理员密码已修改

## 10. 常见问题

### 管理端可以打开但数据为空

优先检查：

- 管理端请求是否命中了正确的 API 地址
- CORS 白名单是否包含当前来源
- `adminToken` 是否正确携带

### 用户端请求直接失败

优先检查：

- `api/config/config.php` 中 `API_URL` 是否正确
- uni-app 当前环境是否覆盖了 `apiBaseURL`
- API 服务是否可直接访问 `/api`

### 登录后频繁跳回登录页

优先检查：

- `JWT_SECRET` 是否在多个环境保持一致
- 客户端和服务端时间是否严重偏差
- `Authorization` 请求头是否被网关或代理剥离
