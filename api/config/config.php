<?php
// 项目根目录
if(!defined('PROJECT_ROOT')) define('PROJECT_ROOT', dirname(__DIR__));

// 调试模式配置
define('DEBUG_MODE', true); // 设置为false关闭调试模式

define('DEBUG_LOG_FILE', PROJECT_ROOT . '/logs/debug.log'); // 调试日志文件路径

define('DEBUG_DISPLAY_ERRORS', true); // 是否在浏览器显示错误信息

define('DEBUG_LOG_ERRORS', true); // 是否将错误信息记录到日志文件

// 数据库配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'housekeeping_service');
define('DB_USER', 'root');
define('DB_PASS', '123456');

// JWT配置
define('JWT_SECRET', 'your_jwt_secret_key_here');
define('JWT_EXPIRE', 3600 * 24); // token有效期24小时

// API基础URL
define('API_URL', 'http://127.0.0.1:8000');

// 上传文件配置
define('UPLOAD_PATH', PROJECT_ROOT . '/uploads/');
define('UPLOAD_URL', API_URL . '/uploads/');

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
