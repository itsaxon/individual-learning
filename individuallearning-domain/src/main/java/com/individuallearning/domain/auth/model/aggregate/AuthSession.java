package com.individuallearning.domain.auth.model.aggregate;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.auth.model.event.TokenRefreshedEvent;
import com.individuallearning.domain.auth.model.event.UserLoggedInEvent;
import com.individuallearning.domain.auth.model.event.UserLoggedOutEvent;
import com.individuallearning.domain.auth.model.valobj.SessionId;
import com.individuallearning.domain.auth.model.valobj.SessionStatus;
import com.individuallearning.domain.shared.AggregateRoot;
import com.individuallearning.domain.system.model.valobj.UserId;
import lombok.Getter;

import java.time.Instant;

/**
 * 认证会话聚合根：封装会话生命周期内的一致性规则，外部只能通过行为方法改变状态。
 * 不暴露 setter，保证聚合内一致性。
 */
@Getter
public class AuthSession extends AggregateRoot<SessionId> {

    private UserId userId;
    private String accessToken;
    private String refreshToken;
    private SessionStatus status;
    private String loginIp;
    private Instant loginTime;
    private Instant expireTime;
    private Instant refreshExpireTime;
    private Instant createTime;
    private Instant updateTime;

    private AuthSession() {
    }

    /**
     * 创建新会话（领域工厂方法）
     */
    public static AuthSession create(SessionId id, UserId userId, String accessToken, String refreshToken,
                                     Instant expireTime, Instant refreshExpireTime, String loginIp) {
        if (userId == null) {
            throw new DomainException("用户ID不能为空");
        }
        if (accessToken == null || accessToken.isBlank()) {
            throw new DomainException("访问令牌不能为空");
        }
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new DomainException("刷新令牌不能为空");
        }
        AuthSession session = new AuthSession();
        session.id = id;
        session.userId = userId;
        session.accessToken = accessToken;
        session.refreshToken = refreshToken;
        session.status = SessionStatus.active();
        session.loginIp = loginIp;
        Instant now = Instant.now();
        session.loginTime = now;
        session.expireTime = expireTime;
        session.refreshExpireTime = refreshExpireTime;
        session.createTime = now;
        session.updateTime = now;
        session.raiseEvent(new UserLoggedInEvent(userId.getValue(), id.getValue(), loginIp));
        return session;
    }

    /**
     * 由持久化数据重建聚合（供 Repository 实现使用）
     */
    public static AuthSession reconstitute(SessionId id, UserId userId, String accessToken, String refreshToken,
                                           SessionStatus status, String loginIp, Instant loginTime,
                                           Instant expireTime, Instant refreshExpireTime,
                                           Instant createTime, Instant updateTime) {
        AuthSession session = new AuthSession();
        session.id = id;
        session.userId = userId;
        session.accessToken = accessToken;
        session.refreshToken = refreshToken;
        session.status = status;
        session.loginIp = loginIp;
        session.loginTime = loginTime;
        session.expireTime = expireTime;
        session.refreshExpireTime = refreshExpireTime;
        session.createTime = createTime;
        session.updateTime = updateTime;
        return session;
    }

    /**
     * 刷新令牌：校验状态与刷新令牌有效期 → 替换令牌 → 抛出领域事件
     */
    public void refresh(String newAccessToken, String newRefreshToken, Instant newExpireTime, Instant newRefreshExpireTime) {
        if (!status.isActive()) {
            throw new DomainException("会话当前状态不允许刷新令牌");
        }
        if (refreshExpireTime == null || Instant.now().isAfter(refreshExpireTime)) {
            throw new DomainException("刷新令牌已过期");
        }
        if (newAccessToken == null || newAccessToken.isBlank()) {
            throw new DomainException("新的访问令牌不能为空");
        }
        if (newRefreshToken == null || newRefreshToken.isBlank()) {
            throw new DomainException("新的刷新令牌不能为空");
        }
        this.accessToken = newAccessToken;
        this.refreshToken = newRefreshToken;
        this.expireTime = newExpireTime;
        this.refreshExpireTime = newRefreshExpireTime;
        this.updateTime = Instant.now();
        raiseEvent(new TokenRefreshedEvent(userId.getValue(), id.getValue()));
    }

    /**
     * 登出：校验状态 → 撤销会话 → 抛出领域事件
     */
    public void logout() {
        if (!status.isActive()) {
            throw new DomainException("会话当前状态不允许登出");
        }
        this.status = status.revoke();
        this.updateTime = Instant.now();
        raiseEvent(new UserLoggedOutEvent(userId.getValue(), id.getValue()));
    }

    /**
     * 会话是否处于可用状态（状态有效且访问令牌未过期）
     */
    public boolean isActive() {
        return status.isActive() && expireTime != null && Instant.now().isBefore(expireTime);
    }

    /**
     * 会话是否可刷新令牌（状态有效且刷新令牌未过期）
     */
    public boolean isRefreshable() {
        return status.isActive() && refreshExpireTime != null && Instant.now().isBefore(refreshExpireTime);
    }
}
