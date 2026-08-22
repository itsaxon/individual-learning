package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.common.enums.StatusEnum;
import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;

/**
 * 角色状态值对象：聚合根对外暴露状态变更行为，避免直接 set。
 */
public final class RoleStatus implements Serializable {

    private final int code;

    private RoleStatus(int code) {
        this.code = code;
    }

    public static RoleStatus of(int code) {
        return new RoleStatus(code);
    }

    public static RoleStatus enabled() {
        return new RoleStatus(StatusEnum.ENABLE.getCode());
    }

    public static RoleStatus disabled() {
        return new RoleStatus(StatusEnum.DISABLE.getCode());
    }

    public int getCode() {
        return code;
    }

    public boolean isEnabled() {
        return code == StatusEnum.ENABLE.getCode();
    }

    /** 切换为禁用，若已是禁用抛领域异常 */
    public RoleStatus disable() {
        if (!isEnabled()) {
            throw new DomainException("当前已是禁用状态");
        }
        return disabled();
    }

    /** 切换为启用，若已是启用抛领域异常 */
    public RoleStatus enable() {
        if (isEnabled()) {
            throw new DomainException("当前已是启用状态");
        }
        return enabled();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RoleStatus that)) return false;
        return code == that.code;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }

    @Override
    public String toString() {
        return "RoleStatus{code=" + code + '}';
    }
}
