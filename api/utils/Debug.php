<?php
/**
 * Debug工具类
 * 提供调试相关的功能，可通过配置文件中的DEBUG_MODE开关控制
 */
class Debug {
    /**
     * 记录调试信息
     * @param mixed $data 要记录的数据
     * @param string $label 数据标签
     * @param string $type 日志类型 (info, warning, error)
     */
    public static function log($data, $label = 'Debug', $type = 'info') {
        // 检查是否开启调试模式
        if (!defined('DEBUG_MODE') || !DEBUG_MODE) {
            return;
        }
        
        // 获取当前时间
        $time = date('Y-m-d H:i:s');
        
        // 构建日志消息
        $logMessage = "[$time] [$type] $label: ";
        
        // 处理不同类型的数据
        if (is_array($data) || is_object($data)) {
            $logMessage .= print_r($data, true);
        } else if (is_bool($data)) {
            $logMessage .= $data ? 'true' : 'false';
        } else if (is_null($data)) {
            $logMessage .= 'null';
        } else {
            $logMessage .= $data;
        }
        
        $logMessage .= "\n";
        
        // 显示错误信息到浏览器
        if (defined('DEBUG_DISPLAY_ERRORS') && DEBUG_DISPLAY_ERRORS && $type === 'error') {
            echo '<pre style="background: #f0f0f0; padding: 10px; border: 1px solid #ddd;">';
            echo htmlspecialchars($logMessage);
            echo '</pre>';
        }
        
        // 写入日志文件
        if (defined('DEBUG_LOG_ERRORS') && DEBUG_LOG_ERRORS) {
            // 确保日志文件存在并可写
            $logFile = defined('DEBUG_LOG_FILE') ? DEBUG_LOG_FILE : dirname(__DIR__) . '/logs/debug.log';
            
            // 尝试创建日志目录
            $logDir = dirname($logFile);
            if (!is_dir($logDir)) {
                @mkdir($logDir, 0777, true);
            }
            
            // 写入日志
            @file_put_contents($logFile, $logMessage, FILE_APPEND);
        }
    }
    
    /**
     * 记录普通信息
     * @param mixed $data 要记录的数据
     * @param string $label 数据标签
     */
    public static function info($data, $label = 'Info') {
        self::log($data, $label, 'info');
    }
    
    /**
     * 记录警告信息
     * @param mixed $data 要记录的数据
     * @param string $label 数据标签
     */
    public static function warning($data, $label = 'Warning') {
        self::log($data, $label, 'warning');
    }
    
    /**
     * 记录错误信息
     * @param mixed $data 要记录的数据
     * @param string $label 数据标签
     */
    public static function error($data, $label = 'Error') {
        self::log($data, $label, 'error');
    }
    
    /**
     * 显示变量的详细信息并终止脚本执行
     * @param mixed $data 要显示的变量
     */
    public static function dump($data) {
        if (!defined('DEBUG_MODE') || !DEBUG_MODE) {
            return;
        }
        
        echo '<pre style="background: #f0f0f0; padding: 10px; border: 1px solid #ddd;">';
        var_dump($data);
        echo '</pre>';
        exit;
    }
    
    /**
     * 设置PHP错误处理
     */
    public static function setupErrorHandler() {
        if (!defined('DEBUG_MODE') || !DEBUG_MODE) {
            // 非调试模式下，隐藏所有错误
            error_reporting(0);
            ini_set('display_errors', '0');
            return;
        }
        
        // 设置错误报告级别
        error_reporting(E_ALL);
        
        // 是否在浏览器显示错误
        if (defined('DEBUG_DISPLAY_ERRORS')) {
            ini_set('display_errors', DEBUG_DISPLAY_ERRORS ? '1' : '0');
        } else {
            ini_set('display_errors', '1');
        }
        
        // 注册自定义错误处理函数
        set_error_handler(function($errno, $errstr, $errfile, $errline) {
            // 忽略E_NOTICE和E_DEPRECATED类型的错误
            if ($errno === E_NOTICE || $errno === E_DEPRECATED) {
                return;
            }
            
            $errorType = self::getErrorType($errno);
            $errorMessage = "$errorType: $errstr in $errfile on line $errline";
            
            self::log($errorMessage, 'PHP Error', 'error');
            
            // 如果是致命错误，记录后继续执行PHP默认错误处理
            if ($errno === E_ERROR || $errno === E_PARSE || $errno === E_COMPILE_ERROR || $errno === E_CORE_ERROR) {
                return false;
            }
            
            return true;
        });
        
        // 注册异常处理函数
        set_exception_handler(function($exception) {
            $errorMessage = "Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine() . "\nStack trace: " . $exception->getTraceAsString();
            
            self::log($errorMessage, 'PHP Exception', 'error');
        });
        
        // 注册脚本终止处理函数
        register_shutdown_function(function() {
            $error = error_get_last();
            if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_COMPILE_ERROR, E_CORE_ERROR])) {
                $errorType = self::getErrorType($error['type']);
                $errorMessage = "$errorType: " . $error['message'] . " in " . $error['file'] . " on line " . $error['line'];
                
                self::log($errorMessage, 'PHP Shutdown Error', 'error');
            }
        });
    }
    
    /**
     * 获取错误类型描述
     * @param int $errno 错误编号
     * @return string 错误类型描述
     */
    private static function getErrorType($errno) {
        $errorTypes = [
            E_ERROR => 'E_ERROR',
            E_WARNING => 'E_WARNING',
            E_PARSE => 'E_PARSE',
            E_NOTICE => 'E_NOTICE',
            E_CORE_ERROR => 'E_CORE_ERROR',
            E_CORE_WARNING => 'E_CORE_WARNING',
            E_COMPILE_ERROR => 'E_COMPILE_ERROR',
            E_COMPILE_WARNING => 'E_COMPILE_WARNING',
            E_USER_ERROR => 'E_USER_ERROR',
            E_USER_WARNING => 'E_USER_WARNING',
            E_USER_NOTICE => 'E_USER_NOTICE',
            E_STRICT => 'E_STRICT',
            E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
            E_DEPRECATED => 'E_DEPRECATED',
            E_USER_DEPRECATED => 'E_USER_DEPRECATED'
        ];
        
        return isset($errorTypes[$errno]) ? $errorTypes[$errno] : 'UNKNOWN';
    }
}