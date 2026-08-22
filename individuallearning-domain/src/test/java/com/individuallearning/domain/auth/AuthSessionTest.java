package com.individuallearning.domain.auth;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.model.event.TokenRefreshedEvent;
import com.individuallearning.domain.auth.model.event.UserLoggedInEvent;
import com.individuallearning.domain.auth.model.event.UserLoggedOutEvent;
import com.individuallearning.domain.auth.model.valobj.SessionId;
import com.individuallearning.domain.auth.model.valobj.SessionStatus;
import com.individuallearning.domain.shared.DomainEvent;
import com.individuallearning.domain.system.model.valobj.UserId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AuthSession 聚合根单元测试：验证会话生命周期与领域规则。
 */
class AuthSessionTest {

    @Test
    @DisplayName("create：创建成功，字段正确，status=active，产生 UserLoggedInEvent")
    void create_shouldBuildSessionAndRaiseEvent() {
        SessionId id = new SessionId(100L);
        Instant expireTime = Instant.now().plusSeconds(3600);
        Instant refreshExpireTime = Instant.now().plusSeconds(86400);

        AuthSession session = AuthSession.create(id, new UserId(1L), "access-token", "refresh-token",
                expireTime, refreshExpireTime, "127.0.0.1");

        assertThat(session.getId()).isEqualTo(id);
        assertThat(session.getUserId()).isEqualTo(new UserId(1L));
        assertThat(session.getAccessToken()).isEqualTo("access-token");
        assertThat(session.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(session.getStatus().isActive()).isTrue();
        assertThat(session.getLoginIp()).isEqualTo("127.0.0.1");
        assertThat(session.getLoginTime()).isNotNull();
        assertThat(session.getExpireTime()).isEqualTo(expireTime);
        assertThat(session.getRefreshExpireTime()).isEqualTo(refreshExpireTime);
        assertThat(session.getCreateTime()).isNotNull();
        assertThat(session.getUpdateTime()).isNotNull();

        // 验证事件
        assertThat(session.domainEvents()).hasSize(1);
        DomainEvent event = session.domainEvents().get(0);
        assertThat(event).isInstanceOf(UserLoggedInEvent.class);
        UserLoggedInEvent loggedIn = (UserLoggedInEvent) event;
        assertThat(loggedIn.getUserId()).isEqualTo(1L);
        assertThat(loggedIn.getSessionId()).isEqualTo(100L);
        assertThat(loggedIn.getLoginIp()).isEqualTo("127.0.0.1");
    }

    @Test
    @DisplayName("refresh：有效会话刷新成功，令牌更新，产生 TokenRefreshedEvent")
    void refresh_shouldUpdateTokensAndRaiseEvent() {
        AuthSession session = createActiveSession();
        Instant newExpire = Instant.now().plusSeconds(7200);
        Instant newRefreshExpire = Instant.now().plusSeconds(172800);

        session.refresh("new-access", "new-refresh", newExpire, newRefreshExpire);

        assertThat(session.getAccessToken()).isEqualTo("new-access");
        assertThat(session.getRefreshToken()).isEqualTo("new-refresh");
        assertThat(session.getExpireTime()).isEqualTo(newExpire);
        assertThat(session.getRefreshExpireTime()).isEqualTo(newRefreshExpire);
        assertThat(session.domainEvents())
                .anyMatch(e -> e instanceof TokenRefreshedEvent);
    }

    @Test
    @DisplayName("refresh：已撤销会话刷新 → 抛 DomainException")
    void refresh_shouldThrowWhenRevoked() {
        AuthSession session = createActiveSession();
        session.logout();

        assertThatThrownBy(() -> session.refresh("a", "r",
                Instant.now().plusSeconds(60), Instant.now().plusSeconds(60)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("不允许刷新令牌");
    }

    @Test
    @DisplayName("logout：有效会话登出成功，status=revoked，产生 UserLoggedOutEvent")
    void logout_shouldRevokeAndRaiseEvent() {
        AuthSession session = createActiveSession();

        session.logout();

        assertThat(session.getStatus().isRevoked()).isTrue();
        assertThat(session.domainEvents())
                .anyMatch(e -> e instanceof UserLoggedOutEvent);
    }

    @Test
    @DisplayName("logout：已撤销会话登出 → 抛 DomainException")
    void logout_shouldThrowWhenAlreadyRevoked() {
        AuthSession session = createActiveSession();
        session.logout();

        assertThatThrownBy(session::logout)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("不允许登出");
    }

    @Test
    @DisplayName("isActive：有效状态且未过期 → true；过期 → false")
    void isActive_shouldReflectStatusAndExpiry() {
        AuthSession session = createActiveSession();
        assertThat(session.isActive()).isTrue();

        // 过期会话不算活跃
        AuthSession expired = createSessionWithExpiry(
                Instant.now().minusSeconds(60), Instant.now().plusSeconds(60));
        assertThat(expired.isActive()).isFalse();
    }

    @Test
    @DisplayName("isRefreshable：有效状态且刷新令牌未过期 → true；过期 → false")
    void isRefreshable_shouldReflectStatusAndRefreshExpiry() {
        AuthSession session = createActiveSession();
        assertThat(session.isRefreshable()).isTrue();

        AuthSession expired = createSessionWithExpiry(
                Instant.now().plusSeconds(60), Instant.now().minusSeconds(60));
        assertThat(expired.isRefreshable()).isFalse();
    }

    @Test
    @DisplayName("reconstitute：重建后字段一致")
    void reconstitute_shouldRestoreAllFields() {
        SessionId id = new SessionId(200L);
        Instant loginTime = Instant.parse("2025-01-01T00:00:00Z");
        Instant expireTime = Instant.parse("2025-01-01T01:00:00Z");
        Instant refreshExpireTime = Instant.parse("2025-01-02T00:00:00Z");
        Instant createTime = Instant.parse("2025-01-01T00:00:00Z");
        Instant updateTime = Instant.parse("2025-01-01T00:30:00Z");

        AuthSession session = AuthSession.reconstitute(id, new UserId(5L), "a-token", "r-token",
                SessionStatus.active(), "10.0.0.1", loginTime, expireTime, refreshExpireTime,
                createTime, updateTime);

        assertThat(session.getId()).isEqualTo(id);
        assertThat(session.getUserId()).isEqualTo(new UserId(5L));
        assertThat(session.getAccessToken()).isEqualTo("a-token");
        assertThat(session.getRefreshToken()).isEqualTo("r-token");
        assertThat(session.getStatus().isActive()).isTrue();
        assertThat(session.getLoginIp()).isEqualTo("10.0.0.1");
        assertThat(session.getLoginTime()).isEqualTo(loginTime);
        assertThat(session.getExpireTime()).isEqualTo(expireTime);
        assertThat(session.getRefreshExpireTime()).isEqualTo(refreshExpireTime);
        assertThat(session.getCreateTime()).isEqualTo(createTime);
        assertThat(session.getUpdateTime()).isEqualTo(updateTime);
        assertThat(session.domainEvents()).isEmpty();
    }

    /** 创建一个有效的活跃会话 */
    private AuthSession createActiveSession() {
        return createSessionWithExpiry(
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(86400));
    }

    /** 按指定过期时间创建活跃会话 */
    private AuthSession createSessionWithExpiry(Instant expireTime, Instant refreshExpireTime) {
        return AuthSession.create(new SessionId(100L), new UserId(1L), "access-token", "refresh-token",
                expireTime, refreshExpireTime, "127.0.0.1");
    }
}
