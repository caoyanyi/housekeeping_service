<?php
// 用户模型类
require_once PROJECT_ROOT . '/utils/Database.php';

class User {
    private $conn;
    private $table_name = 'users';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // 用户注册
    public function register($phone, $password, $nickname = '', $avatar = '', $gender = 0, $address = '') {
        $query = "INSERT INTO " . $this->table_name . " (phone, password, nickname, avatar, gender, address) VALUES (?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$phone, password_hash($password, PASSWORD_DEFAULT), $nickname, $avatar, $gender, $address])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // 用户登录
    public function login($phone, $password) {
        $query = "SELECT id, phone, password, nickname, avatar, gender, address, status FROM " . $this->table_name . " WHERE phone = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$phone]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 检查用户状态
            if ($row['status'] == 0) {
                return ['code' => 403, 'message' => '账号已被冻结'];
            }
            
            // 验证密码
            if (password_verify($password, $row['password'])) {
                unset($row['password']);
                return ['code' => 200, 'data' => $row];
            } else {
                return ['code' => 401, 'message' => '密码错误'];
            }
        }
        
        return ['code' => 404, 'message' => '用户不存在'];
    }
    
    // 获取用户信息
    public function getUserInfo($userId) {
        $query = "SELECT id, phone, nickname, avatar, gender, address, status, created_at, updated_at FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return null;
    }
    
    // 更新用户信息
    public function updateUserInfo($userId, $data) {
        $fields = [];
        $params = [$userId];
        foreach ($data as $key => $value) {
            if ($key != 'id' && $key != 'password') {
                $fields[] = "$key = ?";
                $params[] = $value;
            }
        }
        
        $query = "UPDATE " . $this->table_name . " SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute($params);
    }
    
    // 修改密码
    public function changePassword($userId, $oldPassword, $newPassword) {
        $query = "SELECT password FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userId]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 验证旧密码
            if (password_verify($oldPassword, $row['password'])) {
                $updateQuery = "UPDATE " . $this->table_name . " SET password = ? WHERE id = ?";
                $updateStmt = $this->conn->prepare($updateQuery);
                
                if ($updateStmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $userId])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 检查手机号是否已注册
    public function checkPhoneExists($phone) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE phone = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$phone]);
        
        return $stmt->rowCount() > 0;
    }
    
    // 管理端：获取所有用户列表
    public function getAllUsers($search = '', $status = null, $page = 1, $pageSize = 10) {
        $offset = ($page - 1) * $pageSize;
        $query = "SELECT id, phone, nickname, avatar, gender, address, status, created_at, updated_at FROM " . $this->table_name;
        
        // 添加搜索条件
        $whereClause = [];
        $params = [];
        if (!empty($search)) {
            $whereClause[] = "(phone LIKE ? OR nickname LIKE ?)";
            $searchParam = "%" . $search . "%";
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        if ($status) {
            $whereClause[] = "status = ?";
            $params[] = $status;
        }
        
        if (!empty($whereClause)) {
            $query .= " WHERE " . implode(' AND ', $whereClause);
        }
        
        // 添加分页和排序
        $query .= " ORDER BY created_at DESC LIMIT ?, ?";
        $params[] = $offset;
        $params[] = $pageSize;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 管理端：获取用户总数
    public function getTotalUsers($search = '', $status = null) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        
        // 添加搜索条件
        $whereClause = [];
        $params = [];
        if (!empty($search)) {
            $whereClause[] = "(phone LIKE ? OR nickname LIKE ?)";
            $searchParam = "%" . $search . "%";
            $params[] = $searchParam;
            $params[] = $searchParam;
        }
        if ($status) {
            $whereClause[] = "status = ?";
            $params[] = $status;
        }
        
        if (!empty($whereClause)) {
            $query .= " WHERE " . implode(' AND ', $whereClause);
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }
    
    // 管理端：更新用户状态
    public function updateUserStatus($userId, $status) {
        $query = "UPDATE " . $this->table_name . " SET status = ? WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$status, $userId]);
    }
}