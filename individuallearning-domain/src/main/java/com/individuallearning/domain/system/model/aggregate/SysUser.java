package com.individuallearning.domain.system.model.aggregate;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.shared.AggregateRoot;
import com.individuallearning.domain.system.model.event.UserPasswordChangedEvent;
import com.individuallearning.domain.system.model.event.UserRegisteredEvent;
import com.individuallearning.domain.system.model.valobj.Email;
import com.individuallearning.domain.system.model.valobj.Password;
import com.individuallearning.domain.system.model.valobj.UserId;
import com.individuallearning.domain.system.model.valobj.Username;
import com.individuallearning.domain.system.model.valobj.UserStatus;
import com.individuallearning.domain.system.service.PasswordEncoder;
import lombok.Getter;

import java.time.Instant;

/**
 * 系统用户聚合根：封装用户核心业务规则，外部只能通过行为方法改变状态。
 * 不暴露 setter，保证聚合内一致性。
 */
@Getter
public class SysUser extends AggregateRoot<UserId> {

    private Username username;
    private Password password;
    private Email email;
    private String nickname;
    private UserStatus status;
    private Instant createTime;
    private Instant updateTime;

    private SysUser() {
    }

    /**
     * 注册新用户（领域工厂方法）
     */
    public static SysUser register(UserId id, Username username, Password password, Email email) {
        SysUser user = new SysUser();
        user.id = id;
        user.username = username;
        user.password = password;
        user.email = email;
        user.nickname = username.getValue();
        user.status = UserStatus.enabled();
        Instant now = Instant.now();
        user.createTime = now;
        user.updateTime = now;
        user.raiseEvent(new UserRegisteredEvent(id.getValue(), username.getValue(), email.getValue()));
        return user;
    }

    /**
     * 由持久化数据重建聚合（供 Repository 实现使用）
     */
    public static SysUser reconstitute(UserId id, Username username, Password password, Email email,
                                       String nickname, UserStatus status, Instant createTime, Instant updateTime) {
        SysUser user = new SysUser();
        user.id = id;
        user.username = username;
        user.password = password;
        user.email = email;
        user.nickname = nickname;
        user.status = status;
        user.createTime = createTime;
        user.updateTime = updateTime;
        return user;
    }

    /**
     * 修改密码：校验旧密码 → 生成新密码 → 抛出领域事件
     */
    public void changePassword(String oldRawPassword, String newRawPassword, PasswordEncoder encoder) {
        if (!this.password.matches(oldRawPassword, encoder)) {
            throw new DomainException("原密码不正确");
        }
        this.password = Password.encode(newRawPassword, encoder);
        this.updateTime = Instant.now();
        raiseEvent(new UserPasswordChangedEvent(id.getValue()));
    }

    /**
     * 修改邮箱
     */
    public void updateEmail(Email email) {
        if (email == null) {
            throw new DomainException("邮箱不能为空");
        }
        this.email = email;
        this.updateTime = Instant.now();
    }

    /**
     * 修改昵称
     */
    public void updateNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new DomainException("昵称不能为空");
        }
        this.nickname = nickname;
        this.updateTime = Instant.now();
    }

    /**
     * 启用
     */
    public void enable() {
        this.status = status.enable();
        this.updateTime = Instant.now();
    }

    /**
     * 禁用
     */
    public void disable() {
        this.status = status.disable();
        this.updateTime = Instant.now();
    }

    /**
     * 校验明文密码是否正确
     */
    public boolean checkPassword(String rawPassword, PasswordEncoder encoder) {
        return this.password.matches(rawPassword, encoder);
    }
}
