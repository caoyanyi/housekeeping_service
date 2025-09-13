<?php
// 求职模型类
require_once PROJECT_ROOT . '/utils/Database.php';

class JobApplication {
    private $conn;
    private $table_name = 'job_applications';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // 创建求职申请
    public function createJobApplication($data) {
        $query = "INSERT INTO " . $this->table_name . " (name, phone, id_card, address, birth_place, certificates, work_years, work_area, notes) "
               . "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        $certificates = isset($data['certificates']) ? json_encode($data['certificates']) : '[]';
        
        if ($stmt->execute([
            $data['name'],
            $data['phone'],
            $data['id_card'],
            isset($data['address']) ? $data['address'] : '',
            isset($data['birth_place']) ? $data['birth_place'] : '',
            $certificates,
            isset($data['work_years']) ? intval($data['work_years']) : 0,
            isset($data['work_area']) ? $data['work_area'] : '',
            isset($data['notes']) ? $data['notes'] : ''
        ])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // 获取求职申请列表（管理端用）
    public function getJobApplications($search = null, $status = null, $page = 1, $pageSize = 10) {
        $query = "SELECT id, name, phone, id_card, address, birth_place, certificates, work_years, work_area, notes, status, created_at, updated_at "
               . "FROM " . $this->table_name . " ";
        
        $where = [];
        $params = [];
        
        if ($search) {
            $where[] = "(name LIKE ? OR phone LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if ($status) {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }
        
        $query .= " ORDER BY created_at DESC";
        
        if ($page && $pageSize) {
            $offset = ($page - 1) * $pageSize;
            $query .= " LIMIT ?, ?";
            $params[] = $offset;
            $params[] = $pageSize;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 解析JSON字段
        foreach ($result as &$item) {
            if (!empty($item['certificates'])) {
                $item['certificates'] = json_decode($item['certificates'], true);
            }
        }
        
        return $result;
    }
    
    // 获取单个求职申请详情
    public function getJobApplicationDetail($id) {
        $query = "SELECT id, name, phone, id_card, address, birth_place, certificates, work_years, work_area, notes, status, created_at, updated_at "
               . "FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 解析JSON字段
        if ($result && !empty($result['certificates'])) {
            $result['certificates'] = json_decode($result['certificates'], true);
        }
        
        return $result;
    }
    
    // 更新求职申请状态
    public function updateJobApplicationStatus($id, $status) {
        $query = "UPDATE " . $this->table_name . " SET status = ? WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$status, $id]);
    }
    
    // 更新求职申请信息
    public function updateJobApplication($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET "
               . "name = ?, phone = ?, id_card = ?, address = ?, birth_place = ?, work_years = ?, work_area = ?, notes = ? "
               . "WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['id_card'],
            isset($data['address']) ? $data['address'] : '',
            isset($data['birth_place']) ? $data['birth_place'] : '',
            isset($data['work_years']) ? intval($data['work_years']) : 0,
            isset($data['work_area']) ? $data['work_area'] : '',
            isset($data['notes']) ? $data['notes'] : '',
            $id
        ]);
    }
    
    // 删除求职申请
    public function deleteJobApplication($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$id]);
    }
    
    // 获取总数
    public function getTotalCount($search = null, $status = null) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name;
        
        $where = [];
        $params = [];
        
        if ($search) {
            $where[] = "(name LIKE ? OR phone LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if ($status) {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'];
    }
}