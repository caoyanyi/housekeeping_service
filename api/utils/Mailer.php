<?php
/**
 * 邮件发送工具类
 * 安全处理PHPMailer依赖，确保系统稳定运行
 */
class Mailer {
    /**
     * 检查邮件功能是否已启用
     * @return bool
     */
    private static function isMailEnabled() {
        return defined('MAIL_HOST') && !empty(MAIL_HOST);
    }
    
    /**
     * 发送邮件
     * @param string|array $to 收件人邮箱
     * @param string $subject 邮件主题
     * @param string $body 邮件内容
     * @return bool 是否发送成功
     */
    public static function sendEmail($to, $subject, $body) {
        // 检查是否启用了邮件功能
        if (!self::isMailEnabled()) {
            error_log('邮件功能未启用，请检查config.php中的邮件配置');
            return false;
        }
        
        // 尝试使用PHPMailer发送邮件（如果可用）
        $result = self::trySendWithPHPMailer($to, $subject, $body);
        
        // 如果PHPMailer发送失败或不可用，则尝试使用PHP内置mail函数
        if (!$result) {
            return self::sendWithPHPMail($to, $subject, $body);
        }
        
        return $result;
    }
    
    /**
     * 尝试使用PHPMailer发送邮件（不直接依赖PHPMailer类）
     * @param string|array $to 收件人邮箱
     * @param string $subject 邮件主题
     * @param string $body 邮件内容
     * @return bool 是否发送成功
     */
    private static function trySendWithPHPMailer($to, $subject, $body) {
        try {
            // 动态检查PHPMailer是否可用
            if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
                // 尝试加载PHPMailer（静默失败）
                self::tryLoadPHPMailer();
                
                // 如果仍然不可用，返回false
                if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
                    return false;
                }
            }
            
            // 安全创建PHPMailer实例
            $mailClass = 'PHPMailer\PHPMailer\PHPMailer';
            $mail = new $mailClass();
            
            // 服务器设置
            $mail->isSMTP();
            $mail->Host = MAIL_HOST;
            $mail->SMTPAuth = true;
            $mail->Username = MAIL_USERNAME;
            $mail->Password = MAIL_PASSWORD;
            
            // 设置加密方式和端口
            $encryption = defined('MAIL_ENCRYPTION') ? MAIL_ENCRYPTION : '';
            $port = defined('MAIL_PORT') ? MAIL_PORT : 25;
            
            if ($encryption === 'ssl') {
                $mail->SMTPSecure = 'ssl';
                $mail->Port = $port;
            } else if ($encryption === 'tls') {
                $mail->SMTPSecure = 'tls';
                $mail->Port = $port;
            }
            
            // 发件人
            $fromAddress = defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : '';
            $fromName = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : '';
            $mail->setFrom($fromAddress, $fromName);
            
            // 收件人
            if (is_array($to)) {
                foreach ($to as $email) {
                    $mail->addAddress($email);
                }
            } else {
                $mail->addAddress($to);
            }
            
            // 内容
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->AltBody = strip_tags($body);
            
            return $mail->send();
        } catch (Exception $e) {
            error_log('PHPMailer发送邮件失败: ' . $e->getMessage());
            return false;
        } catch (Throwable $e) {
            error_log('PHPMailer发送邮件时发生致命错误: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 尝试加载PHPMailer库（静默失败）
     */
    private static function tryLoadPHPMailer() {
        try {
            // 尝试从不同路径加载PHPMailer
            $possiblePaths = [
                PROJECT_ROOT . '/vendor/phpmailer/phpmailer/src/PHPMailer.php',
                PROJECT_ROOT . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php',
                '/usr/share/php/PHPMailer/src/PHPMailer.php',
                '/var/www/vendor/phpmailer/phpmailer/src/PHPMailer.php'
            ];
            
            foreach ($possiblePaths as $path) {
                if (@file_exists($path)) {
                    @require_once dirname($path) . '/PHPMailer.php';
                    @require_once dirname($path) . '/SMTP.php';
                    @require_once dirname($path) . '/Exception.php';
                    break;
                }
            }
            
            // 如果上述路径都失败，尝试加载Composer自动加载文件
            if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
                $composerAutoloadPaths = [
                    PROJECT_ROOT . '/vendor/autoload.php',
                    PROJECT_ROOT . '/../vendor/autoload.php',
                    '/usr/share/php/vendor/autoload.php'
                ];
                
                foreach ($composerAutoloadPaths as $path) {
                    if (@file_exists($path)) {
                        @require_once $path;
                        break;
                    }
                }
            }
        } catch (Exception $e) {
            // 静默失败，不记录详细错误
        } catch (Throwable $e) {
            // 静默失败，不记录详细错误
        }
    }
    
    /**
     * 使用PHP内置mail函数发送邮件
     * @param string|array $to 收件人邮箱
     * @param string $subject 邮件主题
     * @param string $body 邮件内容
     * @return bool 是否发送成功
     */
    private static function sendWithPHPMail($to, $subject, $body) {
        try {
            // 设置邮件头，确保正确编码
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-type: text/html; charset=utf-8\r\n";
            
            // 对发件人名称进行base64编码
            $fromName = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : '';
            $fromAddress = defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : '';
            
            if (!empty($fromName) && !empty($fromAddress)) {
                $encodedFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
                $headers .= "From: " . $encodedFromName . " <" . $fromAddress . ">\r\n";
            }
            
            // 处理多个收件人
            $toAddresses = is_array($to) ? implode(',', $to) : $to;
            
            // 发送邮件
            return @mail($toAddresses, $subject, $body, $headers);
        } catch (Exception $e) {
            error_log('PHP内置mail函数发送失败: ' . $e->getMessage());
            return false;
        } catch (Throwable $e) {
            error_log('PHP内置mail函数发送时发生致命错误: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 发送预约通知邮件
     * @param array $appointmentData 预约数据
     * @return bool 是否发送成功
     */
    public static function sendAppointmentNotification($appointmentData) {
        // 检查邮件功能是否启用
        if (!self::isMailEnabled()) {
            return false;
        }
        
        // 获取收件人列表
        if (!defined('APPOINTMENT_NOTIFY_EMAILS') || empty(APPOINTMENT_NOTIFY_EMAILS)) {
            error_log('未配置预约通知收件人邮箱');
            return false;
        }
        
        // 处理收件人列表
        $recipients = self::parseRecipients(APPOINTMENT_NOTIFY_EMAILS);
        if (!is_array($recipients) || empty($recipients)) {
            error_log('预约通知收件人邮箱格式不正确');
            return false;
        }
        
        // 构建邮件主题，确保正确编码
        $subject = '=?UTF-8?B?' . base64_encode('【家政服务系统】新的预约通知') . '?=';
        
        // 构建邮件内容，确保所有变量都存在且安全
        $safeData = self::sanitizeData($appointmentData);
        $body = self::buildAppointmentEmailBody($safeData);
        
        // 发送邮件
        return self::sendEmail($recipients, $subject, $body);
    }
    
    /**
     * 解析收件人列表
     * @param string $recipientsConfig 收件人配置字符串
     * @return array 解析后的收件人邮箱数组
     */
    private static function parseRecipients($recipientsConfig) {
        try {
            // 优先尝试使用数组形式
            $unserialized = @unserialize($recipientsConfig);
            if (is_array($unserialized)) {
                return $unserialized;
            }
            
            // 如果不是序列化的数组，则尝试按逗号分隔
            $recipients = explode(',', $recipientsConfig);
            return array_map('trim', $recipients);
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * 清理数据，防止XSS攻击
     * @param array $data 原始数据
     * @return array 清理后的数据
     */
    private static function sanitizeData($data) {
        if (!is_array($data)) {
            return [];
        }
        
        return array_map(function($value) {
            return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
        }, $data);
    }
    
    /**
     * 构建预约通知邮件内容
     * @param array $safeData 安全的数据
     * @return string 邮件内容
     */
    private static function buildAppointmentEmailBody($safeData) {
        $body = "<html><body>";
        $body .= "<h3>新的预约信息</h3>";
        $body .= "<table border='1' cellspacing='0' cellpadding='5'>";
        $body .= "<tr><td>预约编号</td><td>{$safeData['id']}</td></tr>";
        $body .= "<tr><td>用户姓名</td><td>{$safeData['user_name']}</td></tr>";
        $body .= "<tr><td>联系电话</td><td>{$safeData['user_phone']}</td></tr>";
        $body .= "<tr><td>服务名称</td><td>{$safeData['service_name']}</td></tr>";
        $body .= "<tr><td>预约时间</td><td>{$safeData['appointment_time']}</td></tr>";
        $body .= "<tr><td>预约地址</td><td>{$safeData['address']}</td></tr>";
        $body .= "<tr><td>备注信息</td><td>{$safeData['remark']}</td></tr>";
        $body .= "</table>";
        $body .= "<p>请及时处理此预约。</p>";
        $body .= "</body></html>";
        
        return $body;
    }
}