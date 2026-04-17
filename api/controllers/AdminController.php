<?php
// 管理员控制器
require_once PROJECT_ROOT . '/models/Admin.php';
require_once PROJECT_ROOT . '/utils/JWT.php';
require_once PROJECT_ROOT . '/utils/Response.php';

// 加载Debug工具类
if (!class_exists('Debug')) {
    require_once PROJECT_ROOT . '/utils/Debug.php';
}

class AdminController {
    private $adminModel;
    
    public function __construct() {
        $this->adminModel = new Admin();
    }
    
    // 管理员登录
    public function login() {
        $params = Response::getRequestParams();
        
        // 记录调试信息
        Debug::info($params, 'Admin Login Request');
        
        // 验证参数
        if (empty($params['username']) || empty($params['password'])) {
            Debug::error('Username or password is empty');
            Response::error('用户名和密码不能为空');
        }
        
        // 登录
        $result = $this->adminModel->login($params['username'], $params['password']);
        
        // 记录登录结果
        Debug::info($result, 'Admin Login Result');
        
        if ($result['code'] == 200) {
            // 生成token
            $token = JWT::encode(['admin_id' => $result['data']['id']]);
            $result['data']['token'] = $token;
            Response::success($result['data'], '登录成功');
        } else {
            Response::error($result['message'], $result['code']);
        }
    }
    
    // 获取管理员信息
    public function getAdminInfo($id = null) {
        $adminId = Response::verifyAdminToken();
        
        // 如果没有传入id，则使用token中的admin_id
        if (empty($id)) {
            $id = $adminId;
        }
        
        $adminInfo = $this->adminModel->getAdminInfo($id);
        
        if ($adminInfo) {
            Response::success($adminInfo);
        } else {
            Response::error('管理员信息不存在');
        }
    }
    
    // 更新管理员信息
    public function updateAdminInfo($id = null) {
        $adminId = Response::verifyAdminToken();
        
        // 如果没有传入id，则使用token中的admin_id
        if (empty($id)) {
            $id = $adminId;
        }
        
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params)) {
            Response::error('参数不能为空');
        }
        
        // 不允许修改用户名
        if (isset($params['username'])) {
            unset($params['username']);
        }
        
        if ($this->adminModel->updateAdminInfo($id, $params)) {
            Response::success([], '更新成功');
        } else {
            Response::error('更新失败');
        }
    }
    
    // 修改密码
    public function changePassword() {
        $adminId = Response::verifyAdminToken();
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['old_password']) || empty($params['new_password'])) {
            Response::error('旧密码和新密码不能为空');
        }
        
        if ($this->adminModel->changePassword($adminId, $params['old_password'], $params['new_password'])) {
            Response::success([], '密码修改成功');
        } else {
            Response::error('旧密码不正确或修改失败');
        }
    }
    
    // 获取管理员列表
    public function getAdminList() {
        Response::verifyAdminToken();
        
        $params = Response::getRequestParams();
        
        $role = isset($params['role']) ? $params['role'] : null;
        $status = isset($params['status']) ? $params['status'] : null;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $pageSize = isset($params['page_size']) ? intval($params['page_size']) : (isset($params['pageSize']) ? intval($params['pageSize']) : 10);
        
        $admins = $this->adminModel->getAllAdmins($role, $status, $page, $pageSize);
        
        Response::success($admins);
    }
    
    // 添加管理员
    public function addAdmin() {
        Response::verifyAdminToken();
        
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['username']) || empty($params['password'])) {
            Response::error('用户名和密码不能为空');
        }
        
        $adminId = $this->adminModel->addAdmin(
            $params['username'],
            $params['password'],
            isset($params['nickname']) ? $params['nickname'] : '',
            isset($params['avatar']) ? $params['avatar'] : '',
            isset($params['role']) ? $params['role'] : 1,
            isset($params['status']) ? $params['status'] : 1
        );
        
        if ($adminId) {
            Response::success(['admin_id' => $adminId], '添加成功');
        } else {
            Response::error('添加失败');
        }
    }
    
    // 删除管理员
    public function deleteAdmin($id = null) {
        Response::verifyAdminToken();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('管理员ID不能为空');
            }
        }
        
        if ($this->adminModel->deleteAdmin($id)) {
            Response::success([], '删除成功');
        } else {
            Response::error('删除失败');
        }
    }
    
    // 获取仪表盘数据
    public function getDashboardData() {
        Response::verifyAdminToken();
        
        // 加载所需模型
        require_once PROJECT_ROOT . '/models/User.php';
        require_once PROJECT_ROOT . '/models/Service.php';
        require_once PROJECT_ROOT . '/models/Category.php';
        require_once PROJECT_ROOT . '/models/Appointment.php';
        
        $userModel = new User();
        $serviceModel = new Service();
        $categoryModel = new Category();
        $appointmentModel = new Appointment();
        
        // 获取各统计数据
        $statistics = [
            'users' => $userModel->getTotalUsers(),
            'services' => $serviceModel->getTotalCount(),
            'categories' => $categoryModel->getTotalCount(),
            'todayAppointments' => $appointmentModel->getTodayAppointmentsCount()
        ];
        
        // 获取最近预约记录
        $recentAppointments = $appointmentModel->getRecentAppointments(10);
        
        Response::success([
            'statistics' => $statistics,
            'recentAppointments' => $recentAppointments
        ]);
    }
}
