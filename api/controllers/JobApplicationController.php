<?php
// 求职控制器
require_once PROJECT_ROOT . '/models/JobApplication.php';
require_once PROJECT_ROOT . '/utils/Response.php';
require_once PROJECT_ROOT . '/utils/Mailer.php';

class JobApplicationController {
    private $jobApplicationModel;
    
    public function __construct() {
        $this->jobApplicationModel = new JobApplication();
    }
    
    // 客户端提交求职申请（无需登录）
    public function submitJobApplication() {
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['name']) || empty($params['phone']) || empty($params['id_card'])) {
            Response::error('姓名、电话和身份证号不能为空');
        }
        
        $jobApplicationId = $this->jobApplicationModel->createJobApplication($params);
        
        if ($jobApplicationId) {
            // 发送邮件通知（使用try-catch确保邮件发送失败不影响预约流程）
            try {
                $emailData = [
                    'id' => $jobApplicationId,
                    'name' => $params['name'],
                    'phone' => $params['phone'],
                    'id_card' => $params['id_card'],
                    'address' => isset($params['address']) ? $params['address'] : '',
                    'birth_place' => isset($params['birth_place']) ? $params['birth_place'] : '',
                    'work_years' => isset($params['work_years']) ? $params['work_years'] : 0,
                    'work_area' => isset($params['work_area']) ? $params['work_area'] : '',
                    'notes' => isset($params['notes']) ? $params['notes'] : ''
                ];
                
                // 发送邮件通知
                $subject = '新的求职申请 - ID: ' . $jobApplicationId;
                $body = '<h2>新的求职申请</h2>';
                $body .= '<p><strong>申请人：</strong>' . $emailData['name'] . '</p>';
                $body .= '<p><strong>联系电话：</strong>' . $emailData['phone'] . '</p>';
                $body .= '<p><strong>身份证号：</strong>' . $emailData['id_card'] . '</p>';
                if (!empty($emailData['address'])) {
                    $body .= '<p><strong>住址：</strong>' . $emailData['address'] . '</p>';
                }
                if (!empty($emailData['birth_place'])) {
                    $body .= '<p><strong>籍贯：</strong>' . $emailData['birth_place'] . '</p>';
                }
                $body .= '<p><strong>工作年限：</strong>' . $emailData['work_years'] . '年</p>';
                if (!empty($emailData['work_area'])) {
                    $body .= '<p><strong>工作区域：</strong>' . $emailData['work_area'] . '</p>';
                }
                if (!empty($emailData['notes'])) {
                    $body .= '<p><strong>备注：</strong>' . $emailData['notes'] . '</p>';
                }
                
                // 从配置获取通知邮箱
                $notifyEmails = unserialize(APPOINTMENT_NOTIFY_EMAILS);
                Mailer::sendEmail($notifyEmails, $subject, $body);
            } catch (Exception $e) {
                // 记录错误但不中断流程
                error_log('求职邮件发送失败: ' . $e->getMessage());
            }
            
            Response::success(['application_id' => $jobApplicationId], '求职申请提交成功');
        } else {
            Response::error('求职申请提交失败，请重试');
        }
    }
    
    // 管理端获取求职申请列表
    public function getJobApplications() {
        // 验证管理员身份
        $adminId = Response::getUserId();
        if (!$adminId) {
            Response::error('未授权访问', 401);
        }
        
        $params = Response::getRequestParams();
        
        $search = isset($params['search']) ? $params['search'] : null;
        $status = isset($params['status']) ? $params['status'] : null;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $pageSize = isset($params['pageSize']) ? intval($params['pageSize']) : 10;
        
        $applications = $this->jobApplicationModel->getJobApplications($search, $status, $page, $pageSize);
        $total = $this->jobApplicationModel->getTotalCount($search, $status);
        
        $data = [
            'list' => $applications,
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
            'total_page' => ceil($total / $pageSize)
        ];
        
        Response::success($data);
    }
    
    // 管理端获取单个求职申请详情
    public function getJobApplicationDetail($id) {
        // 验证管理员身份
        $adminId = Response::getUserId();
        if (!$adminId) {
            Response::error('未授权访问', 401);
        }
        
        if (empty($id)) {
            Response::error('申请ID不能为空');
        }
        
        $application = $this->jobApplicationModel->getJobApplicationDetail($id);
        
        if ($application) {
            Response::success(['data' => $application]);
        } else {
            Response::error('未找到该求职申请');
        }
    }
    
    // 管理端更新求职申请状态
    public function updateJobApplicationStatus($id) {
        // 验证管理员身份
        $adminId = Response::getUserId();
        if (!$adminId) {
            Response::error('未授权访问', 401);
        }
        
        $params = Response::getRequestParams();
        
        if (empty($id)) {
            Response::error('申请ID不能为空');
        }
        
        if (empty($params['status'])) {
            Response::error('状态不能为空');
        }
        
        $validStatuses = ['pending', 'reviewed', 'contacted', 'rejected'];
        if (!in_array($params['status'], $validStatuses)) {
            Response::error('无效的状态值');
        }
        
        if ($this->jobApplicationModel->updateJobApplicationStatus($id, $params['status'])) {
            Response::success([], '状态更新成功');
        } else {
            Response::error('状态更新失败');
        }
    }
    
    // 管理端更新求职申请信息
    public function updateJobApplication($id) {
        // 验证管理员身份
        $adminId = Response::getUserId();
        if (!$adminId) {
            Response::error('未授权访问', 401);
        }
        
        $params = Response::getRequestParams();
        
        if (empty($id)) {
            Response::error('申请ID不能为空');
        }
        
        if (empty($params['name']) || empty($params['phone']) || empty($params['id_card'])) {
            Response::error('姓名、电话和身份证号不能为空');
        }
        
        if ($this->jobApplicationModel->updateJobApplication($id, $params)) {
            Response::success([], '信息更新成功');
        } else {
            Response::error('信息更新失败');
        }
    }
    
    // 管理端删除求职申请
    public function deleteJobApplication($id) {
        // 验证管理员身份
        $adminId = Response::getUserId();
        if (!$adminId) {
            Response::error('未授权访问', 401);
        }
        
        if (empty($id)) {
            Response::error('申请ID不能为空');
        }
        
        if ($this->jobApplicationModel->deleteJobApplication($id)) {
            Response::success([], '删除成功');
        } else {
            Response::error('删除失败');
        }
    }
}