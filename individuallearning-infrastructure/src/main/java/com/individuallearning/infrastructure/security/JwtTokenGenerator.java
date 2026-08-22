package com.individuallearning.infrastructure.security;

import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.auth.service.TokenGenerator;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * 令牌生成器实现：基于 jjwt 0.12.6 的 JWT 令牌生成与解析。
 * 密钥、过期时长通过配置注入；HMAC-SHA256 签名。
 */
@Component
public class JwtTokenGenerator implements TokenGenerator {

    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final String CLAIM_USERNAME = "username";

    private final SecretKey key;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtTokenGenerator(@Value("${frame.jwt.secret}") String secret,
                             @Value("${frame.jwt.access-ttl:PT30M}") Duration accessTtl,
                             @Value("${frame.jwt.refresh-ttl:P7D}") Duration refreshTtl) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("frame.jwt.secret 至少需要 32 个字符");
        }
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        this.accessTtl = accessTtl;
        this.refreshTtl = refreshTtl;
    }

    @Override
    public TokenPair generate(Long userId, String username) {
        Instant now = Instant.now();
        Instant accessExpire = now.plus(accessTtl);
        Instant refreshExpire = now.plus(refreshTtl);

        String accessToken = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_USERNAME, username)
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(accessExpire))
                .signWith(key)
                .compact();

        String refreshToken = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .issuedAt(Date.from(now))
                .expiration(Date.from(refreshExpire))
                .signWith(key)
                .compact();

        return new TokenPair(accessToken, refreshToken, accessExpire, refreshExpire);
    }

    @Override
    public ParsedToken parse(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new BizException("访问令牌不能为空");
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(accessToken)
                    .getPayload();
            String type = claims.get(CLAIM_TYPE, String.class);
            if (!TYPE_ACCESS.equals(type)) {
                throw new BizException("令牌类型无效");
            }
            Long userId = Long.parseLong(claims.getSubject());
            String username = claims.get(CLAIM_USERNAME, String.class);
            Instant expireTime = claims.getExpiration() == null ? null : claims.getExpiration().toInstant();
            return new ParsedToken(userId, username, expireTime);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BizException("访问令牌无效或已过期");
        }
    }
}
