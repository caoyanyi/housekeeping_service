<?php
// 请求响应处理类
require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/Debug.php';

class Response {
    // 成功响应
    public static function success($data = [], $message = '操作成功') {
        $response = [
            'code' => 200,
            'message' => $message,
            'data' => $data
        ];
        self::output($response);
    }

    // 错误响应
    public static function error($message = '操作失败', $code = 400) {
        $response = [
            'code' => $code,
            'message' => $message,
            'data' => []
        ];
        self::output($response);
    }

    // 输出响应
    private static function output($response) {
        header('Content-Type: application/json');
        if(isset($response['code'])) http_response_code($response['code']);
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 获取请求参数
    public static function getRequestParams() {
        $method = $_SERVER['REQUEST_METHOD'];
        $params = [];

        if ($method == 'GET') {
            $params = $_GET;
        } else if ($method == 'POST' || $method == 'PUT' || $method == 'DELETE') {
            if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
                $rawData = file_get_contents('php://input');
                $params = json_decode($rawData, true);
            } else {
                parse_str(file_get_contents('php://input'), $params);
            }
        }

        // 确保params是数组
        if (!is_array($params)) {
            $params = [];
        }

        // 合并路由参数（如果有）
        if (isset($GLOBALS['__ROUTE_PARAMS__']) && is_array($GLOBALS['__ROUTE_PARAMS__'])) {
            $params = array_merge($params, $GLOBALS['__ROUTE_PARAMS__']);
        }

        return $params;
    }

    // 获取用户ID或管理员ID（从token中解析）
    public static function getUserId() {
        // 获取所有请求头信息
        $headers = getallheaders();

        // 检查Authorization头是否存在
        if (!isset($headers['Authorization'])) {
            Debug::log('JWT token not found in request headers');
            return null;
        }

        $token = $headers['Authorization'];

        if (empty($token)) {
            Debug::log('Authorization header is empty');
            return null;
        }

        // 去除Bearer前缀
        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
        } else {
            Debug::log('Authorization header does not contain Bearer prefix');
        }

        // 记录尝试解析的token（部分内容）
        Debug::log('Attempting to decode token: ' . substr($token, 0, 20) . '...');

        $payload = JWT::decode($token);

        // 优先检查user_id字段（普通用户）
        if ($payload && isset($payload['user_id'])) {
            Debug::log('Successfully decoded user token, user_id: ' . $payload['user_id']);
            return $payload['user_id'];
        }
        // 其次检查admin_id字段（管理员）
        else if ($payload && isset($payload['admin_id'])) {
            Debug::log('Successfully decoded admin token, admin_id: ' . $payload['admin_id']);
            return $payload['admin_id'];
        } else {
            Debug::log('Failed to decode token or neither user_id nor admin_id present in payload');
            return null;
        }
    }

    /**
     * 验证Token
     * @return mixed|int|null
     */
    public static function verifyToken() {
        // 记录验证请求
        Debug::info('Verifying token for request: ' . (isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'unknown'));

        // 验证用户是否登录
        $userId = self::getUserId();
        if (!$userId) {
            // 记录401错误
            Debug::log('401 Unauthorized: User authentication failed');
            self::error('请先登录', 401);
        }
        return $userId;
    }
}
