<?php
// 路由配置文件 - RESTful API风格
require_once PROJECT_ROOT . '/config/config.php';

// 确保Debug类已加载
if (!class_exists('Debug')) {
    require_once PROJECT_ROOT . '/utils/Debug.php';
}

// 自动加载所有控制器
function autoloadControllers($className) {
    $controllerFile = PROJECT_ROOT . '/controllers/' . $className . '.php';
    if (file_exists($controllerFile)) {
        require_once $controllerFile;
    }
    // 兼容测试环境路径
    else {
        $altPath = dirname(__FILE__) . '/../controllers/' . $className . '.php';
        if (file_exists($altPath)) {
            require_once $altPath;
        }
    }
}

spl_autoload_register('autoloadControllers');

// 设置路由参数到全局变量，供Response类使用
function setRouteParams($routeParams = []) {
    if (!empty($routeParams)) {
        $GLOBALS['__ROUTE_PARAMS__'] = $routeParams;
    }
}

// 获取请求的URI和方法
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);

// 去除基础路径
$basePath = '/api';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// 分割路径
$segments = explode('/', trim($path, '/'));

// 路由处理
if (empty($segments[0])) {
    // 默认路由
    echo json_encode(['code' => 200, 'message' => 'API服务正常运行']);
    exit;
}

// 定义RESTful API路由配置
$restfulRoutes = [];

// 管理员相关路由
$restfulRoutes['admin/admin/admins'] = [
    'GET' => ['AdminController', 'getAdminList'],
    'POST' => ['AdminController', 'addAdmin']
];

$restfulRoutes['admin/admin/admins/{id}'] = [
    'GET' => ['AdminController', 'getAdminInfo'],
    'PUT' => ['AdminController', 'updateAdminInfo'],
    'DELETE' => ['AdminController', 'deleteAdmin']
];

$restfulRoutes['admin/admin/login'] = [
    'POST' => ['AdminController', 'login']
];

$restfulRoutes['admin/admin/change-password'] = [
    'PUT' => ['AdminController', 'changePassword']
];

$restfulRoutes['admin/admin/dashboard'] = [
    'GET' => ['AdminController', 'getDashboardData']
];

// 预约相关路由
$restfulRoutes['admin/appointment/appointments'] = [
    'GET' => ['AppointmentController', 'getAllAppointments']
];

$restfulRoutes['admin/appointment/appointments/{id}'] = [
    'GET' => ['AppointmentController', 'getAppointmentDetail'],
    'PUT' => ['AppointmentController', 'updateAppointmentStatus']
];

$restfulRoutes['admin/appointment/appointments/{id}/status'] = [
    'PUT' => ['AppointmentController', 'updateAppointmentStatus']
];

// 用户相关路由
$restfulRoutes['admin/user/users'] = [
    'GET' => ['UserController', 'getUserList']
];

$restfulRoutes['admin/user/users/{id}'] = [
    'GET' => ['UserController', 'getUserInfo'],
    'PUT' => ['UserController', 'toggleUserStatus']
];

// 分类相关路由
$restfulRoutes['admin/category/categories'] = [
    'GET' => ['CategoryController', 'getCategories'],
    'POST' => ['CategoryController', 'addCategory']
];

$restfulRoutes['admin/category/categories/{id}'] = [
    'GET' => ['CategoryController', 'getCategoryDetail'],
    'PUT' => ['CategoryController', 'updateCategory'],
    'DELETE' => ['CategoryController', 'deleteCategory']
];

// 服务相关路由
$restfulRoutes['admin/service/services'] = [
    'GET' => ['ServiceController', 'getServices'],
    'POST' => ['ServiceController', 'addService']
];

$restfulRoutes['admin/service/services/{id}'] = [
    'GET' => ['ServiceController', 'getServiceDetail'],
    'PUT' => ['ServiceController', 'updateService'],
    'DELETE' => ['ServiceController', 'deleteService']
];

// 普通用户路由
$restfulRoutes['user/register'] = [
    'POST' => ['UserController', 'register']
];

$restfulRoutes['user/login'] = [
    'POST' => ['UserController', 'login']
];

$restfulRoutes['user/profile'] = [
    'GET' => ['UserController', 'getUserInfo'],
    'PUT' => ['UserController', 'updateUserInfo']
];

$restfulRoutes['user/change-password'] = [
    'PUT' => ['UserController', 'changePassword']
];

$restfulRoutes['appointment/appointments'] = [
    'GET' => ['AppointmentController', 'getUserAppointments'],
    'POST' => ['AppointmentController', 'createAppointment']
];

$restfulRoutes['appointment/appointments/{id}'] = [
    'GET' => ['AppointmentController', 'getAppointmentDetail'],
    'DELETE' => ['AppointmentController', 'cancelAppointment']
];

$restfulRoutes['category/categories'] = [
    'GET' => ['CategoryController', 'getCategories']
];

$restfulRoutes['service/services'] = [
    'GET' => ['ServiceController', 'getServices']
];

$restfulRoutes['service/services/{id}'] = [
    'GET' => ['ServiceController', 'getServiceDetail']
];

// 解析请求URL并匹配路由
$matchedRoute = false;
$currentPath = implode('/', $segments);
$controllerName = '';
$methodName = '';
$routeParams = [];

// 尝试匹配路由
foreach ($restfulRoutes as $routePattern => $methodMap) {
    // 如果是精确匹配且请求方法存在
    if ($routePattern === $currentPath && isset($methodMap[$requestMethod])) {
        list($controllerName, $methodName) = $methodMap[$requestMethod];
        $matchedRoute = true;
        break;
    }
    // 尝试匹配带参数的路由
    else if (strpos($routePattern, '{') !== false) {
        // 提取参数名
        preg_match_all('/\{([^\}]*)\}/', $routePattern, $paramNameMatches);
        $paramNames = $paramNameMatches[1];
        
        // 转换路由模式为正则表达式
        $regexPattern = preg_replace_callback('/\{([^\}]*)\}/', function($matches) {
            return '(\\w+)';
        }, $routePattern);
        
        $regexPattern = '#^' . $regexPattern . '$#';
        
        // 匹配路由
        if (preg_match($regexPattern, $currentPath, $matches)) {
            // 去除完整匹配的部分
            array_shift($matches);
            
            // 构建参数名和值的映射
            for ($i = 0; $i < count($paramNames); $i++) {
                if (isset($matches[$i])) {
                    $routeParams[$paramNames[$i]] = $matches[$i];
                }
            }
            
            // 检查请求方法是否支持
            if (isset($methodMap[$requestMethod])) {
                list($controllerName, $methodName) = $methodMap[$requestMethod];
                $matchedRoute = true;
                break;
            }
        }
    }
}

// 如果没有匹配到预定义路由，返回404
if (!$matchedRoute) {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['code' => 404, 'message' => '请求的API不存在']);
    exit;
}

// 检查控制器和方法是否存在
if (class_exists($controllerName) && method_exists($controllerName, $methodName)) {
    // 设置路由参数，使其可在控制器方法中通过Response::getRequestParams()获取（保留兼容性）
    if (!empty($routeParams)) {
        setRouteParams($routeParams);
    }
    
    // 实例化控制器
    $controller = new $controllerName();
    
    // 调用方法并传递路由参数
    if (!empty($routeParams)) {
        // 提取参数值作为函数参数
        $paramValues = array_values($routeParams);
        // 调用控制器方法并传递参数
        call_user_func_array([$controller, $methodName], $paramValues);
    } else {
        // 无参数调用
        $controller->$methodName();
    }
} else {
    // 404 路由不存在
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['code' => 404, 'message' => '请求的API不存在']);
    exit;
}