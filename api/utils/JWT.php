<?php
// JWT工具类
require_once __DIR__ . '/Debug.php';

class JWT {
    // 生成token
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + JWT_EXPIRE;
        $payload = json_encode($payload);
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, JWT_SECRET, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
    }
    
    // 验证并解析token
    public static function decode($token) {
        // 记录token验证信息用于调试
        Debug::log('JWT decode attempt with token: ' . substr($token, 0, 20) . '...');
        
        // 检查token是否为空
        if (empty($token)) {
            Debug::log('JWT decode failed: Token is empty');
            return null;
        }
        
        // 检查token格式
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            Debug::log('JWT decode failed: Invalid token format, parts count: ' . count($parts));
            return null;
        }
        
        $base64UrlHeader = $parts[0];
        $base64UrlPayload = $parts[1];
        $base64UrlSignature = $parts[2];
        
        // 尝试解码payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);
        if ($payload === null) {
            Debug::log('JWT decode failed: Invalid payload');
            return null;
        }
        
        // 验证签名
        $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, JWT_SECRET, true);
        $base64UrlSignatureCheck = self::base64UrlEncode($signature);
        
        if ($base64UrlSignature !== $base64UrlSignatureCheck) {
            Debug::log('JWT decode failed: Invalid signature');
            return null;
        }
        
        // 验证过期时间
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            $expTime = date('Y-m-d H:i:s', $payload['exp']);
            $currentTime = date('Y-m-d H:i:s');
            Debug::log('JWT decode failed: Token expired at ' . $expTime . ', current time: ' . $currentTime);
            return null;
        }
        
        Debug::log('JWT decode success: user_id=' . (isset($payload['user_id']) ? $payload['user_id'] : 'unknown'));
        return $payload;
    }
    
    // Base64Url编码
    private static function base64UrlEncode($text) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }
    
    // Base64Url解码
    private static function base64UrlDecode($text) {
        $text = str_replace(['-', '_'], ['+', '/'], $text);
        $padding = strlen($text) % 4;
        if ($padding > 0) {
            $text .= str_repeat('=', 4 - $padding);
        }
        return base64_decode($text);
    }
}