# 邮件通知功能配置指南

## 功能说明
家政服务系统支持在用户成功创建预约后发送邮件通知给管理员和客服人员。本文档将指导您如何配置邮件服务器信息，使系统能够正常发送邮件通知。

## 配置文件说明
系统的邮件配置位于`api/config/config.php`文件中，包含以下配置项：

```php
// 项目根目录定义（用于正确加载PHPMailer库）
define('PROJECT_ROOT', dirname(__DIR__));

// 邮件服务器配置
define('MAIL_HOST', 'smtp.example.com'); // 邮件服务器地址
define('MAIL_PORT', 465); // 邮件服务器端口，通常SSL为465，TLS为587
define('MAIL_USERNAME', 'your_email@example.com'); // 发送邮件的邮箱账号
define('MAIL_PASSWORD', 'your_email_password'); // 发送邮件的邮箱密码或授权码
define('MAIL_ENCRYPTION', 'ssl'); // 加密方式：ssl或tls
define('MAIL_FROM_ADDRESS', 'your_email@example.com'); // 发件人邮箱
define('MAIL_FROM_NAME', '家政服务系统'); // 发件人名称

// 预约通知收件人配置
define('APPOINTMENT_NOTIFY_EMAILS', serialize([
    'admin@example.com', // 管理员邮箱
    'service@example.com' // 客服邮箱
])); // 预约成功后需要通知的邮箱地址列表
```

## 配置步骤

### 1. 安装PHPMailer依赖
系统使用Composer管理第三方库依赖。首先需要安装PHPMailer库：

1. 确保您的系统已安装Composer
2. 在项目根目录运行以下命令：

```bash
cd /path/to/api
composer require phpmailer/phpmailer
```

如果没有安装Composer，可以参考官方文档进行安装：https://getcomposer.org/download/

### 2. 获取SMTP服务器信息
您需要从您的邮件服务提供商获取以下信息：
- SMTP服务器地址
- SMTP服务器端口
- 加密方式（SSL或TLS）
- 邮箱账号和密码/授权码

### 3. 修改配置文件
使用文本编辑器打开`api/config/config.php`文件，根据您的邮件服务提供商信息修改相应配置项，并确保已添加PROJECT_ROOT定义。

### 4. 配置收件人列表
根据您的实际需求，修改`APPOINTMENT_NOTIFY_EMAILS`配置项，添加或删除需要接收预约通知的邮箱地址。

## 常见邮件服务提供商配置示例

### Gmail配置
```php
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 465);
define('MAIL_USERNAME', 'your_gmail_account@gmail.com');
define('MAIL_PASSWORD', 'your_app_password'); // 注意：这里需要使用应用专用密码，而不是邮箱登录密码
define('MAIL_ENCRYPTION', 'ssl');
define('MAIL_FROM_ADDRESS', 'your_gmail_account@gmail.com');
define('MAIL_FROM_NAME', '家政服务系统');
```

### 阿里云企业邮箱配置
```php
define('MAIL_HOST', 'smtp.mxhichina.com');
define('MAIL_PORT', 465);
define('MAIL_USERNAME', 'your_email@yourdomain.com');
define('MAIL_PASSWORD', 'your_password');
define('MAIL_ENCRYPTION', 'ssl');
define('MAIL_FROM_ADDRESS', 'your_email@yourdomain.com');
define('MAIL_FROM_NAME', '家政服务系统');
```

### 腾讯企业邮箱配置
```php
define('MAIL_HOST', 'smtp.exmail.qq.com');
define('MAIL_PORT', 465);
define('MAIL_USERNAME', 'your_email@yourdomain.com');
define('MAIL_PASSWORD', 'your_password');
define('MAIL_ENCRYPTION', 'ssl');
define('MAIL_FROM_ADDRESS', 'your_email@yourdomain.com');
define('MAIL_FROM_NAME', '家政服务系统');
```

### 网易163邮箱配置
```php
define('MAIL_HOST', 'smtp.163.com');
define('MAIL_PORT', 465);
define('MAIL_USERNAME', 'your_email@163.com');
define('MAIL_PASSWORD', 'your_authorization_code'); // 注意：需要使用授权码
define('MAIL_ENCRYPTION', 'ssl');
define('MAIL_FROM_ADDRESS', 'your_email@163.com');
define('MAIL_FROM_NAME', '家政服务系统');
```

## 启用应用专用密码（重要）
对于Gmail、网易邮箱等服务提供商，需要启用"应用专用密码"或"客户端授权码"，而不是使用邮箱登录密码。请按照以下步骤操作：

1. 登录您的邮箱账号
2. 进入账户设置或安全设置
3. 找到"应用专用密码"或"客户端授权码"选项
4. 生成一个新的专用密码
5. 将此专用密码填入`MAIL_PASSWORD`配置项

## 添加PHPMailer库（可选但推荐）
系统提供了两种邮件发送方式：
1. 使用PHP内置的mail函数（简单但功能有限）
2. 使用PHPMailer库（功能更强大，推荐）

如果您想使用PHPMailer库，请按照以下步骤安装：

1. 在`api`目录下创建`vendor`文件夹
2. 下载PHPMailer库并解压到`vendor`目录
3. 或使用Composer安装：
   ```bash
   cd /path/to/api
   composer require phpmailer/phpmailer
   ```

## 邮件内容说明
预约通知邮件包含以下信息：
- 预约编号
- 用户姓名
- 联系电话
- 服务名称
- 预约时间
- 预约地址
- 备注信息

## 邮件发送机制

### 触发条件
邮件通知在以下情况下触发：
- 用户成功创建新的预约订单后自动发送

### 失败处理
系统对邮件发送失败做了容错处理：
- 邮件发送失败不会影响预约流程
- 失败信息会记录到服务器错误日志中

## 常见问题排查

### 邮件发送失败
如果邮件无法发送，请检查以下几点：

1. **配置项是否正确**
   - 确认SMTP服务器地址和端口是否正确
   - 验证邮箱账号和密码/授权码是否正确
   - 检查加密方式是否与服务器要求一致

2. **服务器防火墙设置**
   - 确认服务器已开放邮件发送端口（如465、587）
   - 有些服务器提供商可能限制了外部SMTP连接

3. **邮箱服务提供商限制**
   - 确认您的邮箱账号未被限制发送邮件
   - 检查是否需要启用POP3/SMTP服务
   - 确认已正确设置应用专用密码或授权码

4. **查看错误日志**
   - 检查服务器的PHP错误日志以获取详细错误信息
   - 错误日志通常位于`/var/log/php7.4-fpm.log`（根据PHP版本调整）

## 安全建议

1. **保护配置文件**
   - 确保`config.php`文件的权限设置正确（建议644或更严格）
   - 不要将包含敏感信息的配置文件提交到版本控制系统中

2. **定期更新密码**
   - 定期更新邮箱密码或应用专用密码
   - 使用强密码，包含大小写字母、数字和特殊字符

3. **限制收件人数量**
   - 只添加必要的收件人邮箱地址
   - 根据业务需求定期更新收件人列表

## 联系我们
如果您在配置过程中遇到任何问题，请联系系统管理员或技术支持人员获取帮助。

---
更新日期：" . date('Y-m-d') . "
版本号：1.0.0