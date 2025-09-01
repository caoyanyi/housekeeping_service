<?php
// 分类控制器
require_once PROJECT_ROOT . '/models/Category.php';
require_once PROJECT_ROOT . '/utils/Response.php';

class CategoryController {
    private $categoryModel;
    
    public function __construct() {
        $this->categoryModel = new Category();
    }
    
    // 获取分类列表
    public function getCategories() {
        $params = Response::getRequestParams();
        
        $status = isset($params['status']) ? $params['status'] : 1;
        
        $categories = $this->categoryModel->getAllCategories($status);
        
        Response::success($categories);
    }
    
    // 获取单个分类
    public function getCategoryDetail($id = null) {
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('分类ID不能为空');
            }
        }
        
        $category = $this->categoryModel->getCategoryById($id);
        
        if ($category) {
            Response::success($category);
        } else {
            Response::error('分类不存在');
        }
    }
    
    // 管理端：添加分类
    public function addCategory() {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        // 验证参数
        if (empty($params['name'])) {
            Response::error('分类名称不能为空');
        }
        
        $categoryId = $this->categoryModel->addCategory(
            $params['name'],
            isset($params['icon']) ? $params['icon'] : '',
            isset($params['sort_order']) ? $params['sort_order'] : 0,
            isset($params['status']) ? $params['status'] : 1
        );
        
        if ($categoryId) {
            Response::success(['category_id' => $categoryId], '添加成功');
        } else {
            Response::error('添加失败');
        }
    }
    
    // 管理端：更新分类
    public function updateCategory($id = null) {
        $userId = Response::verifyToken();
        $params = Response::getRequestParams();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $id = $params['id'];
        }
        // 验证参数
        if (empty($id) || empty($params['name'])) {
            Response::error('分类ID和名称不能为空');
        }
        
        if ($this->categoryModel->updateCategory(
            $id,
            $params['name'],
            isset($params['icon']) ? $params['icon'] : '',
            isset($params['sort_order']) ? $params['sort_order'] : 0,
            isset($params['status']) ? $params['status'] : 1
        )) {
            Response::success([], '更新成功');
        } else {
            Response::error('更新失败');
        }
    }
    
    // 管理端：删除分类
    public function deleteCategory($id = null) {
        $userId = Response::verifyToken();
        
        if (empty($id)) {
            // 兼容旧的调用方式
            $params = Response::getRequestParams();
            $id = $params['id'];
            
            if (empty($id)) {
                Response::error('分类ID不能为空');
            }
        }
        
        if ($this->categoryModel->deleteCategory($id)) {
            Response::success([], '删除成功');
        } else {
            Response::error('删除失败');
        }
    }
}