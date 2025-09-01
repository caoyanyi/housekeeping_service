<?php
// 分类模型类
require_once PROJECT_ROOT . '/utils/Database.php';

class Category {
    private $conn;
    private $table_name = 'categories';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // 获取所有分类
    public function getAllCategories($status = 1) {
        $query = "SELECT id, name, icon, sort_order, status, created_at, updated_at FROM " . $this->table_name;
        
        if ($status) {
            $query .= " WHERE status = ?";
        }
        
        $query .= " ORDER BY sort_order ASC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($status) {
            $stmt->execute([$status]);
        } else {
            $stmt->execute();
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 获取单个分类
    public function getCategoryById($id) {
        $query = "SELECT id, name, icon, sort_order, status, created_at, updated_at FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return null;
    }
    
    // 添加分类
    public function addCategory($name, $icon = '', $sort_order = 0, $status = 1) {
        $query = "INSERT INTO " . $this->table_name . " (name, icon, sort_order, status) VALUES (?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$name, $icon, $sort_order, $status])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // 更新分类
    public function updateCategory($id, $name, $icon = '', $sort_order = 0, $status = 1) {
        $query = "UPDATE " . $this->table_name . " SET name = ?, icon = ?, sort_order = ?, status = ? WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$name, $icon, $sort_order, $status, $id]);
    }
    
    // 删除分类
    public function deleteCategory($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$id]);
    }
    
    // 获取分类总数
    public function getTotalCount($status = 1) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        
        if ($status) {
            $query .= " WHERE status = ?";
        }
        
        $stmt = $this->conn->prepare($query);
        
        if ($status) {
            $stmt->execute([$status]);
        } else {
            $stmt->execute();
        }
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row['total'];
    }
}