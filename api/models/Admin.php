<?php
// 管理员模型类
require_once PROJECT_ROOT . '/utils/Database.php';

class Admin {
    private $conn;
    private $table_name = 'admin';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // 管理员登录
    public function login($username, $password) {
        $query = "SELECT id, username, password, nickname, avatar, role, status FROM " . $this->table_name . " WHERE username = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$username]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 检查管理员状态
            if ($row['status'] == 0) {
                return ['code' => 403, 'message' => '账号已被禁用'];
            }
            
            // 验证密码
            if (password_verify($password, $row['password'])) {
                unset($row['password']);
                return ['code' => 200, 'data' => $row];
            } else {
                return ['code' => 401, 'message' => '密码错误'];
            }
        }
        
        return ['code' => 404, 'message' => '管理员不存在'];
    }
    
    // 获取管理员信息
    public function getAdminInfo($adminId) {
        $query = "SELECT id, username, nickname, avatar, role, status, created_at, updated_at FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$adminId]);
        
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return null;
    }
    
    // 更新管理员信息
    public function updateAdminInfo($adminId, $data) {
        $fields = [];
        $params = [$adminId];
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
    public function changePassword($adminId, $oldPassword, $newPassword) {
        $query = "SELECT password FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$adminId]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 验证旧密码
            if (password_verify($oldPassword, $row['password'])) {
                $updateQuery = "UPDATE " . $this->table_name . " SET password = ? WHERE id = ?";
                $updateStmt = $this->conn->prepare($updateQuery);
                
                if ($updateStmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $adminId])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 获取所有管理员列表
    public function getAllAdmins($role = null, $status = null, $page = 1, $pageSize = 10) {
        $query = "SELECT id, username, nickname, avatar, role, status, created_at, updated_at FROM " . $this->table_name;
        
        $where = [];
        $params = [];
        
        if ($role) {
            $where[] = "role = ?";
            $params[] = $role;
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
        
        foreach ($params as $index => $value) {
            $paramIndex = $index + 1;
            $stmt->bindValue($paramIndex, $value);
        }
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 添加管理员
    public function addAdmin($username, $password, $nickname = '', $avatar = '', $role = 1, $status = 1) {
        $query = "INSERT INTO " . $this->table_name . " (username, password, nickname, avatar, role, status) VALUES (?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(1, $username);
        $stmt->bindValue(2, password_hash($password, PASSWORD_DEFAULT));
        $stmt->bindValue(3, $nickname);
        $stmt->bindValue(4, $avatar);
        $stmt->bindValue(5, $role);
        $stmt->bindValue(6, $status);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // 删除管理员
    public function deleteAdmin($adminId) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $adminId);
        
        return $stmt->execute();
    }
}