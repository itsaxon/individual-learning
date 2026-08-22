package com.individuallearning.domain.auth.repository;

import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.model.valobj.SessionId;

import java.util.Optional;

/**
 * 认证会话仓储端口：定义在领域层，仅表达“获取/保存聚合”的语义，不含任何 SQL 细节。
 * 实现由基础设施层提供（MyBatis Plus）。
 */
public interface AuthSessionRepository {

    /** 按ID查找聚合 */
    Optional<AuthSession> findById(SessionId id);

    /** 按访问令牌查找聚合 */
    Optional<AuthSession> findByAccessToken(String accessToken);

    /** 按刷新令牌查找聚合 */
    Optional<AuthSession> findByRefreshToken(String refreshToken);

    /** 保存聚合（新增或更新） */
    void save(AuthSession session);

    /** 删除聚合 */
    void remove(SessionId id);
}
