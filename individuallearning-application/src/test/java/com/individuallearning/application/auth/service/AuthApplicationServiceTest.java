package com.individuallearning.application.auth.service;

import com.individuallearning.application.auth.command.AuthLoginCommand;
import com.individuallearning.application.auth.command.RefreshTokenCommand;
import com.individuallearning.application.auth.dto.TokenDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.auth.model.valobj.SessionId;
import com.individuallearning.domain.auth.model.valobj.SessionStatus;
import com.individuallearning.domain.auth.repository.AuthSessionRepository;
import com.individuallearning.domain.auth.service.AuthDomainService;
import com.individuallearning.domain.auth.service.TokenGenerator;
import com.individuallearning.domain.shared.DomainEventPublisher;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.model.valobj.UserStatus;
import com.individuallearning.domain.system.repository.SysUserRepository;
import com.individuallearning.domain.system.service.PasswordEncoder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AuthApplicationService 单元测试：验证登录、刷新、登出的用例编排逻辑。
 */
@ExtendWith(MockitoExtension.class)
class AuthApplicationServiceTest {

    @Mock
    private AuthDomainService authDomainService;
    @Mock
    private AuthSessionRepository authSessionRepository;
    @Mock
    private SysUserRepository sysUserRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private TokenGenerator tokenGenerator;
    @Mock
    private DomainEventPublisher domainEventPublisher;

    @InjectMocks
    private AuthApplicationService service;

    private static final String RAW_PASSWORD = "password123";
    private static final String ENCODED_VALUE = "encoded-xxx";

    @Test
    @DisplayName("login：用户存在 + 密码正确 + 启用 → 创建会话 → 保存 → 发布事件 → 返回 TokenDTO")
    void login_shouldReturnTokenDTOWhenCredentialsValid() {
        AuthLoginCommand command = new AuthLoginCommand("alice", RAW_PASSWORD, "127.0.0.1");
        SysUser user = buildEnabledUser();
        when(sysUserRepository.findByUsername(any(Username.class))).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_VALUE)).thenReturn(true);
        AuthSession session = buildActiveSession();
        when(authDomainService.createSession(eq(new UserId(1L)), eq("alice"), eq("127.0.0.1"), eq(tokenGenerator)))
                .thenReturn(session);

        TokenDTO dto = service.login(command);

        verify(authDomainService).createSession(eq(new UserId(1L)), eq("alice"), eq("127.0.0.1"), eq(tokenGenerator));
        verify(authSessionRepository).save(session);
        verify(domainEventPublisher).publish(anyList());
        assertThat(dto.accessToken()).isEqualTo("access-token");
        assertThat(dto.refreshToken()).isEqualTo("refresh-token");
        assertThat(dto.user().id()).isEqualTo(1L);
        assertThat(dto.user().username()).isEqualTo("alice");
    }

    @Test
    @DisplayName("login：用户不存在 → 抛 BizException")
    void login_shouldThrowWhenUserNotFound() {
        AuthLoginCommand command = new AuthLoginCommand("alice", RAW_PASSWORD, "127.0.0.1");
        when(sysUserRepository.findByUsername(any(Username.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(command))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("用户名或密码错误");
        verify(authDomainService, never()).createSession(any(UserId.class), anyString(), any(), any());
    }

    @Test
    @DisplayName("login：密码错误 → 抛 BizException")
    void login_shouldThrowWhenPasswordMismatch() {
        AuthLoginCommand command = new AuthLoginCommand("alice", "wrongPwd123", "127.0.0.1");
        SysUser user = buildEnabledUser();
        when(sysUserRepository.findByUsername(any(Username.class))).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPwd123", ENCODED_VALUE)).thenReturn(false);

        assertThatThrownBy(() -> service.login(command))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("用户名或密码错误");
        verify(authDomainService, never()).createSession(any(UserId.class), anyString(), any(), any());
    }

    @Test
    @DisplayName("refresh：会话存在 + 用户存在 → 刷新 → 保存 → 返回 TokenDTO")
    void refresh_shouldReturnTokenDTOWhenSessionValid() {
        RefreshTokenCommand command = new RefreshTokenCommand("refresh-token");
        AuthSession session = buildActiveSession();
        when(authSessionRepository.findByRefreshToken("refresh-token")).thenReturn(Optional.of(session));
        SysUser user = buildEnabledUser();
        when(sysUserRepository.findById(any(UserId.class))).thenReturn(Optional.of(user));

        TokenDTO dto = service.refresh(command);

        verify(authDomainService).refreshSession(eq(session), eq("alice"), eq(tokenGenerator));
        verify(authSessionRepository).save(session);
        verify(domainEventPublisher).publish(anyList());
        assertThat(dto.accessToken()).isEqualTo("access-token");
        assertThat(dto.refreshToken()).isEqualTo("refresh-token");
    }

    @Test
    @DisplayName("refresh：会话不存在 → 抛 BizException")
    void refresh_shouldThrowWhenSessionNotFound() {
        RefreshTokenCommand command = new RefreshTokenCommand("invalid-refresh");
        when(authSessionRepository.findByRefreshToken("invalid-refresh")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.refresh(command))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("刷新令牌无效或已过期");
        verify(authDomainService, never()).refreshSession(any(), anyString(), any());
    }

    @Test
    @DisplayName("logout：会话存在 → 登出 → 保存 → 发布事件")
    void logout_shouldCallDomainServiceAndPublishEvents() {
        String accessToken = "access-token";
        AuthSession session = buildActiveSession();
        when(authSessionRepository.findByAccessToken(accessToken)).thenReturn(Optional.of(session));

        service.logout(accessToken);

        verify(authDomainService).logout(session);
        verify(authSessionRepository).save(session);
        verify(domainEventPublisher).publish(anyList());
    }

    @Test
    @DisplayName("logout：会话不存在 → 抛 BizException")
    void logout_shouldThrowWhenSessionNotFound() {
        String accessToken = "invalid-token";
        when(authSessionRepository.findByAccessToken(accessToken)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.logout(accessToken))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("访问令牌无效");
        verify(authDomainService, never()).logout(any());
    }

    /** 构造一个启用状态的用户 */
    private SysUser buildEnabledUser() {
        Instant now = Instant.now();
        return SysUser.reconstitute(
                new UserId(1L),
                new Username("alice"),
                Password.ofEncoded(ENCODED_VALUE),
                new Email("alice@example.com"),
                "alice",
                UserStatus.enabled(),
                now,
                now);
    }

    /** 构造一个活跃会话（令牌未过期） */
    private AuthSession buildActiveSession() {
        Instant now = Instant.now();
        return AuthSession.reconstitute(
                new SessionId(100L),
                new UserId(1L),
                "access-token",
                "refresh-token",
                SessionStatus.active(),
                "127.0.0.1",
                now,
                now.plusSeconds(3600),
                now.plusSeconds(86400),
                now,
                now);
    }
}
