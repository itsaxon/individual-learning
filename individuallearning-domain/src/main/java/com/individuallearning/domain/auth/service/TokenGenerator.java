package com.individuallearning.domain.auth.service;

import com.individuallearning.common.exception.DomainException;

import java.time.Instant;

/**
 * 令牌生成器端口：领域层定义，基础设施层提供 JWT 等实现。
 */
public interface TokenGenerator {

    /**
     * 为指定用户生成令牌对
     */
    TokenPair generate(Long userId, String username);

    /**
     * 解析访问令牌，无效抛领域异常
     */
    ParsedToken parse(String accessToken);

    /**
     * 令牌对
     */
    record TokenPair(String accessToken, String refreshToken,
                     Instant accessExpireTime, Instant refreshExpireTime) {
    }

    /**
     * 解析后的令牌信息
     */
    record ParsedToken(Long userId, String username, Instant expireTime) {
    }
}
