<?php
// 预约模型类
require_once PROJECT_ROOT . '/utils/Database.php';
require_once PROJECT_ROOT . '/models/User.php';
require_once PROJECT_ROOT . '/models/Service.php';

class Appointment {
    private $conn;
    private $table_name = 'appointments';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // 创建预约
    public function createAppointment($userId, $serviceId, $appointmentDate, $appointmentTime, $contactName, $contactPhone, $address, $notes = '') {
        $query = "INSERT INTO " . $this->table_name . " (user_id, service_id, appointment_date, appointment_time, contact_name, contact_phone, address, notes) "
               . "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$userId, $serviceId, $appointmentDate, $appointmentTime, $contactName, $contactPhone, $address, $notes])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // 获取用户预约列表
    public function getUserAppointments($userId, $status = null, $page = 1, $pageSize = 10) {
        $query = "SELECT a.id, a.service_id, s.title as service_title, s.price as service_price, a.appointment_date, a.appointment_time, a.contact_name, a.contact_phone, a.address, a.notes, a.status, a.created_at, a.updated_at "
               . "FROM " . $this->table_name . " a "
               . "LEFT JOIN services s ON a.service_id = s.id "
               . "WHERE a.user_id = ?";
        
        $params = [$userId];
        
        if ($status) {
            $query .= " AND a.status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY a.created_at DESC";
        
        if ($page && $pageSize) {
            $offset = ($page - 1) * $pageSize;
            $query .= " LIMIT ?, ?";
            $params[] = $offset;
            $params[] = $pageSize;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 获取所有预约（管理端用）
    public function getAllAppointments($userId = null, $search = null, $status = null, $startDate = null, $endDate = null, $page = 1, $pageSize = 10) {
        $query = "SELECT a.id, a.user_id, u.nickname as user_name, u.phone as user_phone, a.service_id, s.title as service_title, s.price as service_price, a.appointment_date, a.appointment_time, a.contact_name, a.contact_phone, a.address, a.notes, a.status, a.created_at, a.updated_at "
               . "FROM " . $this->table_name . " a "
               . "LEFT JOIN users u ON a.user_id = u.id "
               . "LEFT JOIN services s ON a.service_id = s.id ";
        
        $where = [];
        $params = [];
        
        if ($userId) {
            $where[] = "a.user_id = ?";
            $params[] = $userId;
        }
        
        if ($search) {
            $where[] = "a.contact_phone = ?";
            $params[] = $search;
        }
        
        if ($status) {
            $where[] = "a.status = ?";
            $params[] = $status;
        }
        
        if ($startDate) {
            $where[] = "a.appointment_date >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $where[] = "a.appointment_date <= ?";
            $params[] = $endDate;
        }
        
        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }
        
        $query .= " ORDER BY a.created_at DESC, id DESC";
        
        if ($page && $pageSize) {
            $offset = ($page - 1) * $pageSize;
            $query .= " LIMIT ?, ?";
            $params[] = $offset;
            $params[] = $pageSize;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 获取单个预约
    public function getAppointmentById($id) {
        $query = "SELECT a.id, a.user_id, u.nickname as user_name, u.phone as user_phone, a.service_id, s.title as service_title, s.price as service_price, a.appointment_date, a.appointment_time, a.contact_name, a.contact_phone, a.address, a.notes, a.status, a.created_at, a.updated_at "
               . "FROM " . $this->table_name . " a "
               . "LEFT JOIN users u ON a.user_id = u.id "
               . "LEFT JOIN services s ON a.service_id = s.id "
               . "WHERE a.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return null;
    }
    
    // 获取预约详情（包含服务和用户信息）- 用于邮件通知
    public function getAppointmentDetailWithServiceAndUser($id) {
        $query = "SELECT a.id, a.user_id, u.nickname as user_name, u.phone as user_phone, a.service_id, s.title as service_title, s.price as service_price, a.appointment_date, a.appointment_time, a.contact_name, a.contact_phone, a.address, a.notes, a.status, a.created_at, a.updated_at "
               . "FROM " . $this->table_name . " a "
               . "LEFT JOIN users u ON a.user_id = u.id "
               . "LEFT JOIN services s ON a.service_id = s.id "
               . "WHERE a.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // 更新预约状态
    public function updateAppointmentStatus($id, $status) {
        $query = "UPDATE " . $this->table_name . " SET status = ? WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$status, $id]);
    }
    
    // 获取预约总数
    public function getTotalCount($userId = null, $search = null, $status = null, $startDate = null, $endDate = null) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        
        $where = [];
        $params = [];
        
        if ($userId) {
            $where[] = "user_id = ?";
            $params[] = $userId;
        }
        
        if ($search) {
            $where[] = "contact_phone = ?";
            $params[] = $search;
        }
        
        if ($status) {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        if ($startDate) {
            $where[] = "appointment_date >= ?";
            $params[] = $startDate;
        }
        
        if ($endDate) {
            $where[] = "appointment_date <= ?";
            $params[] = $endDate;
        }
        
        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row['total'];
    }
    
    // 获取今日预约数量
    public function getTodayAppointmentsCount() {
        $today = date('Y-m-d');
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE appointment_date = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$today]);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }
    
    // 获取最近的预约记录（管理端用）
    public function getRecentAppointments($limit = 5) {
        $query = "SELECT a.id as order_no, u.nickname as user_name, s.title as service_title, a.appointment_date, a.appointment_time, a.status, a.created_at "
               . "FROM " . $this->table_name . " a "
               . "LEFT JOIN users u ON a.user_id = u.id "
               . "LEFT JOIN services s ON a.service_id = s.id "
               . "ORDER BY a.created_at DESC "
               . "LIMIT ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}