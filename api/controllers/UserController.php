<?php
// 用户控制器
require_once PROJECT_ROOT . '/models/User.php';
require_once PROJECT_ROOT . '/utils/JWT.php';
require_once PROJECT_ROOT . '/utils/Response.php';

class UserController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    // 用户注册
    public function register() {
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['phone']) || empty($params['password'])) {
            Response::error('手机号和密码不能为空');
        }
        
        // 验证手机号格式
        if (!preg_match('/^1[3-9]\d{9}$/', $params['phone'])) {
            Response::error('手机号格式不正确');
        }
        
        // 检查手机号是否已注册
        if ($this->userModel->checkPhoneExists($params['phone'])) {
            Response::error('该手机号已注册');
        }
        
        // 注册用户
        $userId = $this->userModel->register(
            $params['phone'],
            $params['password'],
            isset($params['nickname']) ? $params['nickname'] : '',
            isset($params['avatar']) ? $params['avatar'] : '',
            isset($params['gender']) ? $params['gender'] : 0,
            isset($params['address']) ? $params['address'] : ''
        );
        
        if ($userId) {
            // 生成token
            $token = JWT::encode(['user_id' => $userId]);
            Response::success(['user_id' => $userId, 'token' => $token], '注册成功');
        } else {
            Response::error('注册失败，请重试');
        }
    }
    
    // 用户登录
    public function login() {
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['phone']) || empty($params['password'])) {
            Response::error('手机号和密码不能为空');
        }
        
        // 登录
        $result = $this->userModel->login($params['phone'], $params['password']);
        
        if ($result['code'] == 200) {
            // 生成token
            $token = JWT::encode(['user_id' => $result['data']['id']]);
            $result['data']['token'] = $token;
            Response::success($result['data'], '登录成功');
        } else {
            Response::error($result['message'], $result['code']);
        }
    }
    
    // 获取用户信息
    public function getUserInfo() {
        $userId = Response::verifyToken();
        
        $userInfo = $this->userModel->getUserInfo($userId);
        
        if ($userInfo) {
            Response::success($userInfo);
        } else {
            Response::error('用户信息不存在');
        }
    }
    
    // 更新用户信息
    public function updateUserInfo() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params)) {
            Response::error('参数不能为空');
        }
        
        // 不允许修改手机号
        if (isset($params['phone'])) {
            unset($params['phone']);
        }
        
        if ($this->userModel->updateUserInfo($userId, $params)) {
            Response::success([], '更新成功');
        } else {
            Response::error('更新失败');
        }
    }
    
    // 修改密码
    public function changePassword() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['old_password']) || empty($params['new_password'])) {
            Response::error('旧密码和新密码不能为空');
        }
        
        if ($this->userModel->changePassword($userId, $params['old_password'], $params['new_password'])) {
            Response::success([], '密码修改成功');
        } else {
            Response::error('旧密码不正确或修改失败');
        }
    }
    
    // 管理端：获取所有用户列表
    public function getUserList() {
        $userId = Response::verifyToken(); // 验证管理员身份
        $params = Response::getRequestParams();
        
        $search = isset($params['search']) ? $params['search'] : '';
        $status = isset($params['status']) ? $params['status'] : null;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $pageSize = isset($params['pageSize']) ? intval($params['pageSize']) : 10;
        
        $users = $this->userModel->getAllUsers($search, $status, $page, $pageSize);
        $total = $this->userModel->getTotalUsers($search, $status);
        
        $data = [
            'users' => $users,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize
        ];
        
        Response::success($data);
    }
    
    // 管理端：切换用户状态
    public function toggleUserStatus($id = null) {
        $userId = Response::verifyToken(); // 验证管理员身份
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('用户ID不能为空');
            }
        }
        
        $params = Response::getRequestParams();
        $status = isset($params['status']) ? $params['status'] : 0;
        
        if ($this->userModel->updateUserStatus($id, $status)) {
            Response::success([], '状态更新成功');
        } else {
            Response::error('状态更新失败');
        }
    }
}