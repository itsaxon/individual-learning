package com.individuallearning.infrastructure.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * Redis 缓存服务：封装常用操作，屏蔽 RedisTemplate 模板细节。
 */
@Component
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public void set(String key, Object value, Duration timeout) {
        redisTemplate.opsForValue().set(key, value, timeout);
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        return (T) redisTemplate.opsForValue().get(key);
    }

    public boolean delete(String key) {
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }

    public long delete(Collection<String> keys) {
        Long count = redisTemplate.delete(keys);
        return count == null ? 0 : count;
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /** 若 key 不存在则设置值并返回 true，否则返回 false（SET NX + EX） */
    public boolean setIfAbsent(String key, Object value, Duration timeout) {
        Boolean result = redisTemplate.opsForValue().setIfAbsent(key, value, timeout);
        return Boolean.TRUE.equals(result);
    }

    public void expire(String key, Duration timeout) {
        redisTemplate.expire(key, timeout);
    }

    public Set<String> keys(String pattern) {
        Set<String> result = new HashSet<>();
        try (org.springframework.data.redis.core.Cursor<String> cursor = redisTemplate.scan(
                org.springframework.data.redis.core.ScanOptions.scanOptions().match(pattern).count(100).build())) {
            while (cursor.hasNext()) {
                result.add(cursor.next());
            }
        }
        return result;
    }
}
