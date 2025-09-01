<?php
// 服务控制器
require_once PROJECT_ROOT . '/models/Service.php';
require_once PROJECT_ROOT . '/utils/Response.php';

class ServiceController {
    private $serviceModel;
    
    public function __construct() {
        $this->serviceModel = new Service();
    }
    
    // 获取服务列表
    public function getServices() {
        $params = Response::getRequestParams();
        
        $categoryId = isset($params['category_id']) ? $params['category_id'] : null;
        $search = isset($params['search']) ? $params['search'] : '';
        $status = isset($params['status']) ? $params['status'] : 1;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $pageSize = isset($params['page_size']) ? intval($params['page_size']) : 10;
        
        $services = $this->serviceModel->getServices($categoryId, $search, $status, $page, $pageSize);
        $total = $this->serviceModel->getTotalCount($categoryId, $search, $status);
        
        $data = [
            'list' => $services,
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
            'total_page' => ceil($total / $pageSize)
        ];
        
        Response::success($data);
    }
    
    // 获取服务详情
    public function getServiceDetail($id = null) {
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('服务ID不能为空');
            }
        }
        
        $service = $this->serviceModel->getServiceById($id);
        
        if ($service) {
            Response::success($service);
        } else {
            Response::error('服务不存在');
        }
    }
    
    // 管理端：添加服务
    public function addService() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['category_id']) || empty($params['title']) || empty($params['price'])) {
            Response::error('分类、标题和价格不能为空');
        }
        
        $serviceId = $this->serviceModel->addService(
            $params['category_id'],
            $params['title'],
            $params['price'],
            isset($params['description']) ? $params['description'] : '',
            isset($params['image_urls']) ? $params['image_urls'] : [],
            isset($params['duration']) ? $params['duration'] : 60,
            isset($params['status']) ? $params['status'] : 1
        );
        
        if ($serviceId) {
            Response::success(['service_id' => $serviceId], '添加成功');
        } else {
            Response::error('添加失败');
        }
    }
    
    // 管理端：更新服务
    public function updateService($id = null) {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $id = $params['id'];
        }
        
        // 验证参数
        if (empty($id) || empty($params['category_id']) || empty($params['title']) || empty($params['price'])) {
            Response::error('服务ID、分类、标题和价格不能为空');
        }
        
        if ($this->serviceModel->updateService(
            $id,
            $params['category_id'],
            $params['title'],
            $params['price'],
            isset($params['description']) ? $params['description'] : '',
            isset($params['image_urls']) ? $params['image_urls'] : [],
            isset($params['duration']) ? $params['duration'] : 60,
            isset($params['status']) ? $params['status'] : 1
        )) {
            Response::success([], '更新成功');
        } else {
            Response::error('更新失败');
        }
    }
    
    // 管理端：删除服务
    public function deleteService($id = null) {
        $userId = Response::verifyToken();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('服务ID不能为空');
            }
        }
        
        if ($this->serviceModel->deleteService($id)) {
            Response::success([], '删除成功');
        } else {
            Response::error('删除失败');
        }
    }
}