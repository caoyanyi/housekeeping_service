<?php
// 服务模型类
require_once PROJECT_ROOT . '/utils/Database.php';

class Service {
    private $conn;
    private $table_name = 'services';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // 获取服务列表
    public function getServices($categoryId = null, $search = '', $status = 1, $page = 1, $pageSize = 10) {
        $query = "SELECT s.id, s.category_id, c.name as category_name, s.title, s.price, s.description, s.image_urls, s.duration, s.status, s.created_at, s.updated_at "
               . "FROM " . $this->table_name . " s "
               . "LEFT JOIN categories c ON s.category_id = c.id ";
        
        $where = [];
        $params = [];
        
        if ($categoryId) {
            $where[] = "s.category_id = ?";
            $params[] = $categoryId;
        }
        
        if (!empty($search)) {
            $where[] = "(s.title LIKE ? OR s.description LIKE ?)";
            $searchValue = '%' . $search . '%';
            $params[] = $searchValue;
            $params[] = $searchValue;
        }
        
        if ($status) {
            $where[] = "s.status = ?";
            $params[] = $status;
        }
        
        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }
        
        $query .= " ORDER BY s.created_at DESC";
        
        if ($page && $pageSize) {
            $offset = ($page - 1) * $pageSize;
            $query .= " LIMIT ?, ?";
            $params[] = $offset;
            $params[] = $pageSize;
        }
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 解析图片URL数组
        foreach ($services as &$service) {
            if (!empty($service['image_urls'])) {
                $service['image_urls'] = json_decode($service['image_urls'], true);
            }
        }
        
        return $services;
    }
    
    // 获取单个服务
    public function getServiceById($id) {
        $query = "SELECT s.id, s.category_id, c.name as category_name, s.title, s.price, s.description, s.image_urls, s.duration, s.status, s.created_at, s.updated_at "
               . "FROM " . $this->table_name . " s "
               . "LEFT JOIN categories c ON s.category_id = c.id "
               . "WHERE s.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 解析图片URL数组
            if (!empty($service['image_urls'])) {
                $service['image_urls'] = json_decode($service['image_urls'], true);
            }
            
            return $service;
        }
        
        return null;
    }
    
    // 添加服务
    public function addService($categoryId, $title, $price, $description, $imageUrls, $duration = 60, $status = 1) {
        $query = "INSERT INTO " . $this->table_name . " (category_id, title, price, description, image_urls, duration, status) "
               . "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$categoryId, $title, $price, $description, json_encode($imageUrls), $duration, $status])) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // 更新服务
    public function updateService($id, $categoryId, $title, $price, $description, $imageUrls, $duration = 60, $status = 1) {
        $query = "UPDATE " . $this->table_name . " SET "
               . "category_id = ?, "
               . "title = ?, "
               . "price = ?, "
               . "description = ?, "
               . "image_urls = ?, "
               . "duration = ?, "
               . "status = ? "
               . "WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$categoryId, $title, $price, $description, json_encode($imageUrls), $duration, $status, $id]);
    }
    
    // 删除服务
    public function deleteService($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([$id]);
    }
    
    // 获取服务总数
    public function getTotalCount($categoryId = null, $search = '', $status = 1) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        
        $where = [];
        $params = [];
        
        if ($categoryId) {
            $where[] = "category_id = ?";
            $params[] = $categoryId;
        }
        
        if (!empty($search)) {
            $where[] = "(title LIKE ? OR description LIKE ?)";
            $searchValue = '%' . $search . '%';
            $params[] = $searchValue;
            $params[] = $searchValue;
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
        
        return $row['total'];
    }
}