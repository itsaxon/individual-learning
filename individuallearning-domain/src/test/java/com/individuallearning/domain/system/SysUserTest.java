package com.individuallearning.domain.system;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.shared.DomainEvent;
import com.individuallearning.domain.system.model.aggregate.SysUser;
import com.individuallearning.domain.system.model.event.UserPasswordChangedEvent;
import com.individuallearning.domain.system.model.event.UserRegisteredEvent;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.model.valobj.UserStatus;
import com.individuallearning.domain.system.service.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * SysUser 聚合根单元测试：验证工厂方法、行为方法与领域规则。
 */
class SysUserTest {

    private PasswordEncoder encoder;

    private static final String RAW_PASSWORD = "password123";
    private static final String ENCODED_VALUE = "encoded-xxx";

    @BeforeEach
    void setUp() {
        encoder = mock(PasswordEncoder.class);
        // 编码器对任何明文都返回固定值
        when(encoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_VALUE);
        when(encoder.encode("newpassword456")).thenReturn("encoded-new");
        when(encoder.matches(RAW_PASSWORD, ENCODED_VALUE)).thenReturn(true);
        when(encoder.matches("wrongPwd123", ENCODED_VALUE)).thenReturn(false);
    }

    @Test
    @DisplayName("register 工厂方法：创建成功，字段正确，产生 UserRegisteredEvent")
    void register_shouldCreateUserAndRaiseEvent() {
        UserId id = new UserId(1L);
        Username username = new Username("alice");
        Email email = new Email("alice@example.com");
        Password password = Password.encode(RAW_PASSWORD, encoder);

        SysUser user = SysUser.register(id, username, password, email);

        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getUsername().getValue()).isEqualTo("alice");
        assertThat(user.getEmail().getValue()).isEqualTo("alice@example.com");
        assertThat(user.getNickname()).isEqualTo("alice");
        assertThat(user.getStatus().isEnabled()).isTrue();
        assertThat(user.getPassword().getEncodedValue()).isEqualTo(ENCODED_VALUE);
        assertThat(user.getCreateTime()).isNotNull();
        assertThat(user.getUpdateTime()).isNotNull();

        // 验证领域事件
        assertThat(user.domainEvents()).hasSize(1);
        DomainEvent event = user.domainEvents().get(0);
        assertThat(event).isInstanceOf(UserRegisteredEvent.class);
        UserRegisteredEvent registered = (UserRegisteredEvent) event;
        assertThat(registered.getUserId()).isEqualTo(1L);
        assertThat(registered.getUsername()).isEqualTo("alice");
        assertThat(registered.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("checkPassword：正确密码返回 true，错误密码返回 false")
    void checkPassword_shouldMatchRawPassword() {
        SysUser user = createUser();

        assertThat(user.checkPassword(RAW_PASSWORD, encoder)).isTrue();
        assertThat(user.checkPassword("wrongPwd123", encoder)).isFalse();
    }

    @Test
    @DisplayName("changePassword：旧密码正确 → 成功修改并产生 UserPasswordChangedEvent")
    void changePassword_shouldSucceedWhenOldPasswordMatches() {
        SysUser user = createUser();

        user.changePassword(RAW_PASSWORD, "newpassword456", encoder);

        assertThat(user.getPassword().getEncodedValue()).isEqualTo("encoded-new");
        assertThat(user.domainEvents())
                .anyMatch(e -> e instanceof UserPasswordChangedEvent);
    }

    @Test
    @DisplayName("changePassword：旧密码错误 → 抛 DomainException")
    void changePassword_shouldThrowWhenOldPasswordMismatch() {
        SysUser user = createUser();

        assertThatThrownBy(() -> user.changePassword("wrongPwd123", "newpassword456", encoder))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("原密码不正确");
    }

    @Test
    @DisplayName("disable：启用状态 → 成功禁用")
    void disable_shouldSucceedWhenEnabled() {
        SysUser user = createUser();
        assertThat(user.getStatus().isEnabled()).isTrue();

        user.disable();

        assertThat(user.getStatus().isEnabled()).isFalse();
    }

    @Test
    @DisplayName("enable：禁用状态 → 成功启用")
    void enable_shouldSucceedWhenDisabled() {
        SysUser user = createUser();
        user.disable();
        assertThat(user.getStatus().isEnabled()).isFalse();

        user.enable();

        assertThat(user.getStatus().isEnabled()).isTrue();
    }

    @Test
    @DisplayName("enable：重复启用 → 抛 DomainException")
    void enable_shouldThrowWhenAlreadyEnabled() {
        SysUser user = createUser();

        assertThatThrownBy(user::enable)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("已是启用状态");
    }

    @Test
    @DisplayName("disable：重复禁用 → 抛 DomainException")
    void disable_shouldThrowWhenAlreadyDisabled() {
        SysUser user = createUser();
        user.disable();

        assertThatThrownBy(user::disable)
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("已是禁用状态");
    }

    @Test
    @DisplayName("updateNickname：正常修改昵称")
    void updateNickname_shouldSucceedWhenNotBlank() {
        SysUser user = createUser();

        user.updateNickname("新昵称");

        assertThat(user.getNickname()).isEqualTo("新昵称");
    }

    @Test
    @DisplayName("updateNickname：空字符串 → 抛 DomainException")
    void updateNickname_shouldThrowWhenBlank() {
        SysUser user = createUser();

        assertThatThrownBy(() -> user.updateNickname(""))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("昵称不能为空");
    }

    @Test
    @DisplayName("updateNickname：纯空白字符 → 抛 DomainException")
    void updateNickname_shouldThrowWhenWhitespace() {
        SysUser user = createUser();

        assertThatThrownBy(() -> user.updateNickname("   "))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("昵称不能为空");
    }

    @Test
    @DisplayName("reconstitute：重建后字段一致，无领域事件")
    void reconstitute_shouldRestoreFieldsWithoutEvents() {
        UserId id = new UserId(2L);
        Username username = new Username("bob");
        Password password = Password.ofEncoded(ENCODED_VALUE);
        Email email = new Email("bob@example.com");
        Instant createTime = Instant.parse("2025-01-01T00:00:00Z");
        Instant updateTime = Instant.parse("2025-06-01T00:00:00Z");

        SysUser user = SysUser.reconstitute(id, username, password, email, "鲍勃",
                UserStatus.disabled(), createTime, updateTime);

        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getUsername().getValue()).isEqualTo("bob");
        assertThat(user.getPassword().getEncodedValue()).isEqualTo(ENCODED_VALUE);
        assertThat(user.getEmail().getValue()).isEqualTo("bob@example.com");
        assertThat(user.getNickname()).isEqualTo("鲍勃");
        assertThat(user.getStatus().isEnabled()).isFalse();
        assertThat(user.getCreateTime()).isEqualTo(createTime);
        assertThat(user.getUpdateTime()).isEqualTo(updateTime);
        assertThat(user.domainEvents()).isEmpty();
    }

    /** 构造一个已注册的用户用于测试 */
    private SysUser createUser() {
        Password password = Password.encode(RAW_PASSWORD, encoder);
        return SysUser.register(new UserId(1L), new Username("alice"), password, new Email("alice@example.com"));
    }
}
