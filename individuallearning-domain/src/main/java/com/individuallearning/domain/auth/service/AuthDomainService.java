package com.individuallearning.domain.auth.service;

import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.model.valobj.SessionId;
import com.individuallearning.domain.shared.IdGenerator;
import com.individuallearning.domain.system.model.valobj.UserId;

/**
 * 认证领域服务：处理会话创建、刷新、登出等跨聚合/需仓储协作的领域逻辑。
 * 纯 POJO，由基础设施层装配为 Spring Bean。
 * 领域服务不承担持久化，保存由应用层统一控制。
 */
public class AuthDomainService {

    private final IdGenerator idGenerator;

    public AuthDomainService(IdGenerator idGenerator) {
        this.idGenerator = idGenerator;
    }

    /**
     * 创建会话：生成令牌 → 创建聚合 → 返回（不持久化，由应用层保存）
     */
    public AuthSession createSession(UserId userId, String username, String loginIp, TokenGenerator tokenGenerator) {
        TokenGenerator.TokenPair tokenPair = tokenGenerator.generate(userId.getValue(), username);
        SessionId sessionId = new SessionId(idGenerator.nextId());
        AuthSession session = AuthSession.create(
                sessionId, userId,
                tokenPair.accessToken(), tokenPair.refreshToken(),
                tokenPair.accessExpireTime(), tokenPair.refreshExpireTime(),
                loginIp);
        return session;
    }

    /**
     * 刷新会话：生成新令牌对 → 调用聚合刷新 → 返回（不持久化，由应用层保存）
     */
    public AuthSession refreshSession(AuthSession session, String username, TokenGenerator tokenGenerator) {
        TokenGenerator.TokenPair tokenPair = tokenGenerator.generate(session.getUserId().getValue(), username);
        session.refresh(
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                tokenPair.accessExpireTime(),
                tokenPair.refreshExpireTime());
        return session;
    }

    /**
     * 登出：调用聚合登出（不持久化，由应用层保存）
     */
    public void logout(AuthSession session) {
        session.logout();
    }
}
