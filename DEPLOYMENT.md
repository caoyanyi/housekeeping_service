# 家政服务系统部署方案

## 1. 环境准备

### 1.1 服务器环境要求
- **操作系统**：Linux (Ubuntu 18.04+/CentOS 7+) 或 Windows Server
- **Web服务器**：Apache 2.4+ 或 Nginx 1.14+
- **PHP版本**：7.4+（推荐PHP 8.0）
- **MySQL版本**：5.7+（推荐MySQL 8.0）
- **内存**：至少2GB RAM
- **磁盘空间**：至少10GB可用空间

### 1.2 安装必要软件

#### Ubuntu系统
```bash
# 更新软件包
sudo apt update && sudo apt upgrade -y

# 安装Apache、PHP和MySQL
sudo apt install apache2 php-fpm php-mysql php-mbstring php-curl php-json php-gd php-xml php-zip mysql-server -y

# 安装Composer（PHP依赖管理工具）
sudo apt install curl -y
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

#### CentOS系统
```bash
# 更新软件包
sudo yum update -y

# 安装Apache、PHP和MySQL
sudo yum install httpd php php-mysqlnd php-mbstring php-curl php-json php-gd php-xml php-zip mariadb-server -y

# 安装Composer
sudo yum install curl -y
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

## 2. 数据库部署

### 2.1 初始化MySQL数据库
```bash
# 启动MySQL服务
sudo systemctl start mysql
# 设置开机自启
sudo systemctl enable mysql

# 运行安全脚本（设置root密码，移除匿名用户等）
sudo mysql_secure_installation
```

### 2.2 创建数据库和用户
```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE `jiazheng` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建数据库用户并授权
CREATE USER 'jiazheng_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON jiazheng.* TO 'jiazheng_user'@'localhost';
FLUSH PRIVILEGES;

# 退出MySQL
EXIT;
```

### 2.3 导入数据库结构和数据
```bash
# 导入数据库结构
mysql -u jiazheng_user -p jiazheng < database/structure.sql
mysql -u jiazheng_user -p jiazheng < database/admin_structure.sql

# 导入初始数据
mysql -u jiazheng_user -p jiazheng < database/init_data.sql
mysql -u jiazheng_user -p jiazheng < database/admin_init_data.sql
```

## 3. 后端API部署

### 3.1 配置PHP环境
修改PHP配置文件（根据实际安装路径调整）：
```bash
# 对于Ubuntu
sudo nano /etc/php/8.0/fpm/php.ini

# 对于CentOS
sudo nano /etc/php.ini
```

调整以下配置：
```ini
memory_limit = 256M
upload_max_filesize = 20M
post_max_size = 20M
date.timezone = Asia/Shanghai
display_errors = Off
```

重启PHP服务：
```bash
# 对于Ubuntu
sudo systemctl restart php8.0-fpm

# 对于CentOS
sudo systemctl restart php-fpm
```

### 3.2 部署API文件
将项目文件复制到Web服务器根目录：
```bash
# 创建项目目录
sudo mkdir -p /var/www/jiazheng

# 复制项目文件
sudo cp -r /path/to/your/project/* /var/www/jiazheng/

# 设置权限
sudo chown -R www-data:www-data /var/www/jiazheng/
sudo chmod -R 755 /var/www/jiazheng/
```

### 3.3 配置数据库连接
编辑`/var/www/jiazheng/api/config/config.php`文件，修改数据库连接信息：
```php
return [
    // 环境设置
    'environment' => 'production', // 开发环境可设置为'development'
    
    // 数据库配置
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'username' => 'jiazheng_user',
        'password' => 'your_strong_password',
        'database' => 'jiazheng',
        'charset' => 'utf8mb4'
    ],
    
    // JWT配置
    'jwt' => [
        'secret' => 'generate_a_strong_secret_key', // 建议使用随机生成的32位字符串
        'expire' => 86400 // 令牌有效期（秒）
    ],
    
    // 上传配置
    'upload' => [
        'path' => '/var/www/jiazheng/api/uploads/',
        'url' => 'https://your-domain.com/api/uploads/',
        'max_size' => 20971520 // 20MB
    ],
    
    // 应用配置
    'app' => [
        'name' => '家政服务系统',
        'version' => '1.0.0'
    ]
];
```

### 3.4 配置Web服务器

#### Apache配置
创建Apache虚拟主机配置文件：
```bash
sudo nano /etc/apache2/sites-available/jiazheng.conf
```

添加以下内容：
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/jiazheng
    
    <Directory /var/www/jiazheng>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/jiazheng_error.log
    CustomLog ${APACHE_LOG_DIR}/jiazheng_access.log combined
</VirtualHost>
```

启用虚拟主机和重写模块：
```bash
sudo a2ensite jiazheng.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx配置
创建Nginx配置文件：
```bash
sudo nano /etc/nginx/sites-available/jiazheng
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/jiazheng;
    index index.html index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.0-fpm.sock; // 根据PHP版本调整
    }
    
    location ~ /\.ht {
        deny all;
    }
    
    error_log /var/log/nginx/jiazheng_error.log;
    access_log /var/log/nginx/jiazheng_access.log;
}
```

启用配置并重启Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/jiazheng /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. 管理端部署

### 4.1 配置API连接
编辑`/var/www/jiazheng/admin/js/main.js`文件，修改API基础URL：
```javascript
// 设置API基础URL
axios.defaults.baseURL = 'https://your-domain.com/api';
```

### 4.2 优化管理端性能
生产环境建议压缩静态资源：
```bash
# 安装压缩工具
sudo apt install gzip -y

# 启用Apache压缩模块（如果使用Apache）
sudo a2enmod deflate
sudo systemctl restart apache2

# 或在Nginx配置中添加压缩配置
# 在server块中添加：
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## 5. 用户端部署

### 5.1 配置API连接
使用HBuilderX打开`client-uniapp`项目，在App.vue或全局配置文件中设置API基础URL：
```javascript
// App.vue中添加全局配置
onLaunch: function() {
    // 设置API基础URL
    uni.$http.defaults.baseURL = 'https://your-domain.com/api';
    // 其他初始化代码...
}
```

### 5.2 打包发布
1. 在HBuilderX中，点击顶部菜单"发行" -> "原生App-云打包"
2. 填写应用名称、应用标识等信息
3. 选择打包平台（Android/iOS）
4. 点击"打包"按钮
5. 打包完成后，下载安装包进行测试和发布

## 6. SSL证书配置（推荐）
为了保障数据传输安全，建议配置SSL证书启用HTTPS访问。

### 使用Let's Encrypt免费证书
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-apache -y # 对于Apache
sudo apt install certbot python3-certbot-nginx -y # 对于Nginx

# 获取并安装证书
# 对于Apache
sudo certbot --apache
# 对于Nginx
sudo certbot --nginx

# 设置自动续期
certbot renew --dry-run
```

## 7. 配置文件详细说明

### 7.1 API配置文件 (api/config/config.php)
- **environment**: 运行环境，可选'production'或'development'
- **db**: 数据库连接信息
- **jwt**: JWT相关配置
- **upload**: 文件上传配置
- **app**: 应用基本信息

### 7.2 数据库配置项说明
| 配置项 | 说明 | 推荐值 |
|-------|------|-------|
| host | 数据库主机地址 | localhost或数据库服务器IP |
| port | 数据库端口 | 3306 |
| username | 数据库用户名 | jiazheng_user |
| password | 数据库密码 | 强密码（包含大小写字母、数字和特殊字符） |
| database | 数据库名称 | jiazheng |
| charset | 数据库字符集 | utf8mb4 |

### 7.3 JWT配置项说明
| 配置项 | 说明 | 推荐值 |
|-------|------|-------|
| secret | JWT密钥 | 随机生成的32位字符串 |
| expire | 令牌有效期（秒） | 86400（24小时） |

## 8. 系统维护

### 8.1 定期备份
创建备份脚本：
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/jiazheng"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
sudo mysqldump -u jiazheng_user -p'your_password' jiazheng > $BACKUP_DIR/db_backup_$DATE.sql

# 备份项目文件
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/jiazheng/

# 删除7天前的备份
find $BACKUP_DIR -name "*" -type f -mtime +7 -delete
```

设置定时任务：
```bash
crontab -e
# 添加以下内容，每天凌晨2点执行备份
0 2 * * * /path/to/backup_script.sh
```

### 8.2 日志监控
- Apache日志：`/var/log/apache2/jiazheng_*.log`
- Nginx日志：`/var/log/nginx/jiazheng_*.log`
- PHP错误日志：`/var/log/php8.0-fpm.log`（根据PHP版本调整）

### 8.3 性能优化
- 启用PHP OPcache
- 配置MySQL缓存
- 使用CDN加速静态资源

## 9. 常见问题排查

### 9.1 数据库连接失败
- 检查数据库用户名和密码是否正确
- 确认数据库服务是否正常运行
- 验证数据库用户权限是否正确

### 9.2 API请求错误
- 检查API基础URL是否配置正确
- 查看服务器日志以获取详细错误信息
- 确认JWT令牌是否有效

### 9.3 管理端或用户端页面加载异常
- 清除浏览器缓存后重新加载
- 检查网络连接是否正常
- 确认API服务是否正常运行

## 10. 升级指南

当系统需要升级时，请按照以下步骤操作：
1. 备份当前数据库和项目文件
2. 下载最新版本代码
3. 对比并更新配置文件
4. 导入新版本的数据库结构变更脚本
5. 替换项目文件
6. 清除缓存并重启服务
7. 验证系统功能是否正常

## 11. 安全建议
- 定期更新系统和软件包
- 使用强密码并定期更换
- 限制数据库用户权限
- 启用HTTPS加密传输
- 配置防火墙规则
- 定期进行安全审计
- 禁用不必要的服务和端口

---
发布日期：" . date('Y-m-d') . "
版本号：1.0.0