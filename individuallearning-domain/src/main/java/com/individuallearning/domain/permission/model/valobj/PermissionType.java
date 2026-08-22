package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;

/**
 * 权限类型值对象：不可变，封装权限类型码（1=菜单, 2=按钮, 3=API）。
 */
public final class PermissionType implements Serializable {

    public static final int MENU_CODE = 1;
    public static final int BUTTON_CODE = 2;
    public static final int API_CODE = 3;

    private final int code;

    private PermissionType(int code) {
        if (code != MENU_CODE && code != BUTTON_CODE && code != API_CODE) {
            throw new DomainException("权限类型无效: " + code);
        }
        this.code = code;
    }

    public static PermissionType of(int code) {
        return new PermissionType(code);
    }

    public static PermissionType menu() {
        return new PermissionType(MENU_CODE);
    }

    public static PermissionType button() {
        return new PermissionType(BUTTON_CODE);
    }

    public static PermissionType api() {
        return new PermissionType(API_CODE);
    }

    public int getCode() {
        return code;
    }

    public boolean isMenu() {
        return code == MENU_CODE;
    }

    public boolean isButton() {
        return code == BUTTON_CODE;
    }

    public boolean isApi() {
        return code == API_CODE;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PermissionType that)) return false;
        return code == that.code;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }

    @Override
    public String toString() {
        return String.valueOf(code);
    }
}
