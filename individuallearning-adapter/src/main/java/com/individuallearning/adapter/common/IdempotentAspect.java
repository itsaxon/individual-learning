package com.individuallearning.adapter.common;

import com.individuallearning.common.exception.BizException;
import com.individuallearning.infrastructure.cache.RedisService;
import com.individuallearning.infrastructure.context.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.security.MessageDigest;
import java.time.Duration;

/**
 * 防重复提交切面：基于 Redis SET NX 实现幂等控制。
 * <p>
 * key = idempotent:{userId}:{method}:{uri}:{bodyHash}，窗口期内重复请求抛 BizException。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotentAspect {

    private final RedisService redisService;

    private static final String KEY_PREFIX = "idempotent:";

    @Around("@annotation(idempotent)")
    public Object around(ProceedingJoinPoint joinPoint, Idempotent idempotent) throws Throwable {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return joinPoint.proceed();
        }

        String key = buildKey(request);
        Duration window = parseDuration(idempotent.window());

        boolean acquired = redisService.setIfAbsent(key, "1", window);
        if (!acquired) {
            throw new BizException(idempotent.message());
        }

        try {
            return joinPoint.proceed();
        } catch (Exception e) {
            // 执行失败时删除 key，允许重试
            redisService.delete(key);
            throw e;
        }
    }

    /** 构建 Redis key：idempotent:{userId}:{method}:{uri}:{bodyHash} */
    private String buildKey(HttpServletRequest request) {
        Long userId = UserContext.getUserId();
        String uri = request.getRequestURI();
        String bodyHash = hashBody(request);
        return KEY_PREFIX + userId + ":" + request.getMethod() + ":" + uri + ":" + bodyHash;
    }

    /** 计算请求体哈希（MD5 前 16 位） */
    private String hashBody(HttpServletRequest request) {
        try {
            byte[] body;
            if (request instanceof ContentCachingRequestWrapper wrapper) {
                body = wrapper.getContentAsByteArray();
            } else {
                body = new byte[0];
            }
            if (body.length == 0) {
                return "empty";
            }
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            byte[] digest = md5.digest(body);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.substring(0, 16);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs == null ? null : attrs.getRequest();
    }

    /** 解析时长字符串（如 "5s"、"10s"、"1m"） */
    private Duration parseDuration(String duration) {
        if (duration == null || duration.isBlank()) {
            return Duration.ofSeconds(5);
        }
        String trimmed = duration.trim().toLowerCase();
        if (trimmed.endsWith("ms")) {
            return Duration.ofMillis(Long.parseLong(trimmed.substring(0, trimmed.length() - 2)));
        }
        if (trimmed.endsWith("s")) {
            return Duration.ofSeconds(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
        }
        if (trimmed.endsWith("m")) {
            return Duration.ofMinutes(Long.parseLong(trimmed.substring(0, trimmed.length() - 1)));
        }
        return Duration.ofSeconds(5);
    }
}
