package com.individuallearning.application.system.service;

import com.individuallearning.application.system.command.ChangePasswordCommand;
import com.individuallearning.application.system.command.LoginCommand;
import com.individuallearning.application.system.command.RegisterCommand;
import com.individuallearning.application.system.dto.SysUserDTO;
import com.individuallearning.common.exception.BizException;
import com.individuallearning.domain.shared.DomainEventPublisher;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.model.valobj.UserStatus;
import com.individuallearning.domain.system.repository.SysUserRepository;
import com.individuallearning.domain.system.service.PasswordEncoder;
import com.individuallearning.domain.system.service.SysUserDomainService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SysUserApplicationService 单元测试：验证用例编排逻辑。
 */
@ExtendWith(MockitoExtension.class)
class SysUserApplicationServiceTest {

    @Mock
    private SysUserDomainService sysUserDomainService;
    @Mock
    private SysUserRepository sysUserRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private DomainEventPublisher domainEventPublisher;

    @InjectMocks
    private SysUserApplicationService service;

    private static final String RAW_PASSWORD = "password123";
    private static final String ENCODED_VALUE = "encoded-xxx";

    @Test
    @DisplayName("register：调用领域服务创建用户 → 保存 → 发布事件 → 返回 DTO")
    void register_shouldOrchestrateFlowAndReturnDTO() {
        RegisterCommand command = new RegisterCommand("alice", RAW_PASSWORD, "alice@example.com");
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_VALUE);
        SysUser user = buildPersistedUser();
        when(sysUserDomainService.register(any(Username.class), any(Password.class), any(Email.class)))
                .thenReturn(user);

        SysUserDTO dto = service.register(command);

        verify(sysUserRepository).save(user);
        verify(domainEventPublisher).publish(anyList());
        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.username()).isEqualTo("alice");
        assertThat(dto.email()).isEqualTo("alice@example.com");
        assertThat(dto.nickname()).isEqualTo("alice");
        assertThat(dto.status()).isEqualTo(1);
    }

    @Test
    @DisplayName("login：用户存在且密码正确 → 返回 DTO")
    void login_shouldReturnDTOWhenPasswordMatches() {
        LoginCommand command = new LoginCommand("alice", RAW_PASSWORD);
        SysUser user = buildPersistedUser();
        when(sysUserRepository.findByUsername(any(Username.class))).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_VALUE)).thenReturn(true);

        SysUserDTO dto = service.login(command);

        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.username()).isEqualTo("alice");
    }

    @Test
    @DisplayName("login：用户不存在 → 抛 BizException")
    void login_shouldThrowWhenUserNotFound() {
        LoginCommand command = new LoginCommand("alice", RAW_PASSWORD);
        when(sysUserRepository.findByUsername(any(Username.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(command))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("用户名或密码错误");
    }

    @Test
    @DisplayName("login：密码错误 → 抛 BizException")
    void login_shouldThrowWhenPasswordMismatch() {
        LoginCommand command = new LoginCommand("alice", "wrongPwd123");
        SysUser user = buildPersistedUser();
        when(sysUserRepository.findByUsername(any(Username.class))).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPwd123", ENCODED_VALUE)).thenReturn(false);

        assertThatThrownBy(() -> service.login(command))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("用户名或密码错误");
    }

    @Test
    @DisplayName("changePassword：用户存在 → 修改密码 → 保存 → 发布事件")
    void changePassword_shouldSucceedWhenUserExists() {
        ChangePasswordCommand command = new ChangePasswordCommand(1L, RAW_PASSWORD, "newpassword456");
        SysUser user = buildPersistedUser();
        when(sysUserRepository.findById(any(UserId.class))).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_VALUE)).thenReturn(true);
        when(passwordEncoder.encode("newpassword456")).thenReturn("encoded-new");

        service.changePassword(command);

        verify(sysUserRepository).save(user);
        verify(domainEventPublisher).publish(anyList());
    }

    @Test
    @DisplayName("changePassword：用户不存在 → 抛 BizException")
    void changePassword_shouldThrowWhenUserNotFound() {
        ChangePasswordCommand command = new ChangePasswordCommand(999L, RAW_PASSWORD, "newpassword456");
        when(sysUserRepository.findById(any(UserId.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changePassword(command))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("用户不存在");
        verify(sysUserRepository, never()).save(any());
    }

    @Test
    @DisplayName("getProfile：用户存在 → 返回 DTO")
    void getProfile_shouldReturnDTOWhenUserExists() {
        SysUser user = buildPersistedUser();
        when(sysUserRepository.findById(any(UserId.class))).thenReturn(Optional.of(user));

        SysUserDTO dto = service.getProfile(1L);

        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.username()).isEqualTo("alice");
        assertThat(dto.email()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("getProfile：用户不存在 → 抛 BizException")
    void getProfile_shouldThrowWhenUserNotFound() {
        when(sysUserRepository.findById(any(UserId.class))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProfile(999L))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("用户不存在");
    }

    /** 构造一个持久化态的 SysUser（启用状态，密码已编码） */
    private SysUser buildPersistedUser() {
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
}
