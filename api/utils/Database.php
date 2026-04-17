<?php
// 数据库连接类
if (!class_exists('Debug')) {
    require_once __DIR__ . '/Debug.php';
}

class Database {
    private $host = DB_HOST;
    private $port = 3306;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;
    
    // 获取数据库连接
    public function getConnection() {
        $this->conn = null;
        
        try {
            $port = defined('DB_PORT') ? DB_PORT : $this->port;
            $dsn = "mysql:host=" . $this->host . ";port=" . $port . ";dbname=" . $this->db_name . ";charset=utf8";
            $this->conn = new PDO($dsn, $this->username, $this->password, [PDO::ATTR_EMULATE_PREPARES => false]);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            Debug::error('数据库连接错误: ' . $exception->getMessage());
        }
        
        return $this->conn;
    }
}
