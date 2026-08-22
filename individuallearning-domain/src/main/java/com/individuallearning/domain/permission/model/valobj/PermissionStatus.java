package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.common.enums.StatusEnum;
import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;

/**
 * 权限状态值对象：聚合根对外暴露状态变更行为，避免直接 set。
 */
public final class PermissionStatus implements Serializable {

    private final int code;

    private PermissionStatus(int code) {
        this.code = code;
    }

    public static PermissionStatus of(int code) {
        return new PermissionStatus(code);
    }

    public static PermissionStatus enabled() {
        return new PermissionStatus(StatusEnum.ENABLE.getCode());
    }

    public static PermissionStatus disabled() {
        return new PermissionStatus(StatusEnum.DISABLE.getCode());
    }

    public int getCode() {
        return code;
    }

    public boolean isEnabled() {
        return code == StatusEnum.ENABLE.getCode();
    }

    /** 切换为禁用，若已是禁用抛领域异常 */
    public PermissionStatus disable() {
        if (!isEnabled()) {
            throw new DomainException("当前已是禁用状态");
        }
        return disabled();
    }

    /** 切换为启用，若已是启用抛领域异常 */
    public PermissionStatus enable() {
        if (isEnabled()) {
            throw new DomainException("当前已是启用状态");
        }
        return enabled();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PermissionStatus that)) return false;
        return code == that.code;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }

    @Override
    public String toString() {
        return "PermissionStatus{code=" + code + '}';
    }
}
