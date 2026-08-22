package com.individuallearning.domain.system.model.valobj;

import com.individuallearning.common.enums.StatusEnum;
import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;

/**
 * 用户状态值对象：聚合根对外暴露状态变更行为，避免直接 set。
 */
public final class UserStatus implements Serializable {

    private final int code;

    private UserStatus(int code) {
        this.code = code;
    }

    public static UserStatus of(int code) {
        return new UserStatus(code);
    }

    public static UserStatus enabled() {
        return new UserStatus(StatusEnum.ENABLE.getCode());
    }

    public static UserStatus disabled() {
        return new UserStatus(StatusEnum.DISABLE.getCode());
    }

    public int getCode() {
        return code;
    }

    public boolean isEnabled() {
        return code == StatusEnum.ENABLE.getCode();
    }

    /** 切换为禁用 */
    public UserStatus disable() {
        if (!isEnabled()) {
            throw new DomainException("用户当前已是禁用状态");
        }
        return disabled();
    }

    /** 切换为启用 */
    public UserStatus enable() {
        if (isEnabled()) {
            throw new DomainException("用户当前已是启用状态");
        }
        return enabled();
    }
}
