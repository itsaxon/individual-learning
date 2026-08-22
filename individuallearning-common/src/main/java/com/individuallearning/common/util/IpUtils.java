package com.individuallearning.common.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * HTTP 工具类：从 {@link HttpServletRequest} 提取真实客户端 IP 与 User-Agent。
 * <p>
 * 支持常见反向代理头（X-Forwarded-For / X-Real-IP 等），用于游戏调用日志审计。
 */
public final class IpUtils {

    private IpUtils() {
    }

    private static final String[] IP_HEADERS = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
    };

    /**
     * 获取客户端真实 IP，依次检查常见代理头，第一个非 "unknown" 的值即为真实 IP。
     * 若代理头都缺失，回退到 {@link HttpServletRequest#getRemoteAddr()}。
     * X-Forwarded-For 可能有多个值（逗号分隔），取第一个。
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        for (String header : IP_HEADERS) {
            String value = request.getHeader(header);
            if (value != null && !value.isEmpty() && !"unknown".equalsIgnoreCase(value)) {
                int comma = value.indexOf(',');
                return (comma > 0 ? value.substring(0, comma) : value).trim();
            }
        }
        String remote = request.getRemoteAddr();
        return remote == null ? "unknown" : remote;
    }

    /**
     * 获取 User-Agent，并截断到 500 字符以适配数据库字段长度。
     */
    public static String getUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String ua = request.getHeader("User-Agent");
        if (ua != null && ua.length() > 500) {
            return ua.substring(0, 500);
        }
        return ua;
    }
}
