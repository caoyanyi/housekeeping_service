<?php
// API入口文件
// 高级跨域请求配置
// 设置可信的源列表
$trustedOrigins = [
    'http://admin.oop.cc',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
];

// 获取请求源
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// 验证请求源是否在可信列表中
$allowedOrigin = in_array($origin, $trustedOrigins) ? $origin : $trustedOrigins[0];

// 设置CORS头部
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Expose-Headers: Content-Length, X-JSON');
header('Vary: Origin');
header('Content-Type: application/json; charset=utf-8');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 记录所有API请求
if (defined('DEBUG_MODE') && DEBUG_MODE && class_exists('Debug')) {
    // 获取请求信息
    $requestInfo = [
        'request_uri' => $_SERVER['REQUEST_URI'],
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'ip' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'timestamp' => time()
    ];
    
    // 如果是POST请求，记录请求体
    if ($_SERVER['REQUEST_METHOD'] == 'POST' || $_SERVER['REQUEST_METHOD'] == 'PUT') {
        $input = file_get_contents('php://input');
        if (!empty($input)) {
            $requestInfo['body'] = json_decode($input, true);
        }
    }
    
    Debug::info($requestInfo, 'API Request');
}

// 定义项目根目录
define('PROJECT_ROOT', dirname(__FILE__));

// 加载配置文件
require_once PROJECT_ROOT . '/config/config.php';

// 加载Debug工具类
require_once PROJECT_ROOT . '/utils/Debug.php';

// 设置错误处理
Debug::setupErrorHandler();

// 加载路由配置文件
require_once PROJECT_ROOT . '/routes/router.php';