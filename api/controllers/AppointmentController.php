<?php
// 预约控制器
require_once PROJECT_ROOT . '/models/Appointment.php';
require_once PROJECT_ROOT . '/utils/Response.php';
require_once PROJECT_ROOT . '/utils/Mailer.php';

class AppointmentController {
    private $appointmentModel;
    
    public function __construct() {
        $this->appointmentModel = new Appointment();
    }
    
    // 创建预约
    public function createAppointment() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['service_id']) || empty($params['appointment_date']) || empty($params['appointment_time']) || empty($params['contact_name']) || empty($params['contact_phone']) || empty($params['address'])) {
            Response::error('服务、预约日期、时间、联系人、电话和地址不能为空');
        }
        
        $appointmentId = $this->appointmentModel->createAppointment(
            $userId,
            $params['service_id'],
            $params['appointment_date'],
            $params['appointment_time'],
            $params['contact_name'],
            $params['contact_phone'],
            $params['address'],
            isset($params['notes']) ? $params['notes'] : ''
        );
        
        if ($appointmentId) {
            // 获取预约详情以发送邮件通知
            $appointmentDetail = $this->appointmentModel->getAppointmentDetailWithServiceAndUser($appointmentId);
            
            if ($appointmentDetail) {
                // 准备邮件数据
                $emailData = [
                    'id' => $appointmentId,
                    'user_name' => $appointmentDetail['user_name'],
                    'user_phone' => $appointmentDetail['user_phone'],
                    'service_name' => $appointmentDetail['service_title'],
                    'appointment_time' => $appointmentDetail['appointment_date'] . ' ' . $appointmentDetail['appointment_time'],
                    'address' => $appointmentDetail['address'],
                    'remark' => $appointmentDetail['notes']
                ];
                
                // 发送邮件通知（使用try-catch确保邮件发送失败不影响预约流程）
                try {
                    Mailer::sendAppointmentNotification($emailData);
                } catch (Exception $e) {
                    // 记录错误但不中断流程
                    error_log('预约邮件发送失败: ' . $e->getMessage());
                }
            }
            
            Response::success(['appointment_id' => $appointmentId], '预约成功');
        } else {
            Response::error('预约失败，请重试');
        }
    }
    
    // 获取用户预约列表
    public function getUserAppointments() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        $status = isset($params['status']) ? $params['status'] : null;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $pageSize = isset($params['page_size']) ? intval($params['page_size']) : 10;
        
        $appointments = $this->appointmentModel->getUserAppointments($userId, $status, $page, $pageSize);
        $total = $this->appointmentModel->getTotalCount($userId, null, $status);
        
        $data = [
            'list' => $appointments,
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
            'total_page' => ceil($total / $pageSize)
        ];
        
        Response::success($data);
    }
    
    // 获取单个预约详情
    public function getAppointmentDetail($id = null) {
        $userId = Response::verifyToken();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('预约ID不能为空');
            }
        }
        
        $appointment = $this->appointmentModel->getAppointmentById($id);
        
        if ($appointment) {
            Response::success($appointment);
        } else {
            Response::error('预约不存在');
        }
    }
    
    // 用户取消预约
    public function cancelAppointment($id = null) {
        $userId = Response::verifyToken();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('预约ID不能为空');
            }
        }
        
        // 先检查该预约是否属于当前用户
        $appointment = $this->appointmentModel->getAppointmentById($id);
        
        if (!$appointment || $appointment['user_id'] != $userId) {
            Response::error('无权操作该预约');
        }
        
        // 只能取消待确认状态的预约
        if ($appointment['status'] != 1) {
            Response::error('当前状态无法取消预约');
        }
        
        if ($this->appointmentModel->updateAppointmentStatus($id, 4)) {
            Response::success([], '预约已取消');
        } else {
            Response::error('操作失败');
        }
    }
    
    // 管理端：获取所有预约
    public function getAllAppointments() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        $userIdFilter = isset($params['user_id']) ? $params['user_id'] : null;
        $search = isset($params['search']) ? $params['search'] : null;
        $statusFilter = isset($params['status']) ? $params['status'] : null;
        $startDate = isset($params['start_date']) ? $params['start_date'] : null;
        $endDate = isset($params['end_date']) ? $params['end_date'] : null;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $pageSize = isset($params['page_size']) ? intval($params['page_size']) : 10;
        
        $appointments = $this->appointmentModel->getAllAppointments($userIdFilter, $search, $statusFilter, $startDate, $endDate, $page, $pageSize);
        $total = $this->appointmentModel->getTotalCount($userIdFilter, $search, $statusFilter, $startDate, $endDate);
        
        $data = [
            'list' => $appointments,
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
            'total_page' => ceil($total / $pageSize)
        ];
        
        Response::success($data);
    }
    
    // 管理端：更新预约状态
    public function updateAppointmentStatus($id = null) {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $id = $params['id'];
        }
        
        if (empty($id) || empty($params['status'])) {
            Response::error('预约ID和状态不能为空');
        }
        
        if ($this->appointmentModel->updateAppointmentStatus($id, $params['status'])) {
            Response::success([], '状态更新成功');
        } else {
            Response::error('更新失败');
        }
    }
}