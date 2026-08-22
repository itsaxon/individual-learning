package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * 角色编码值对象：不可变，构造时校验格式。
 */
public final class RoleCode implements Serializable {

    private static final Pattern PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]{2,29}$");

    private final String value;

    public RoleCode(String value) {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new DomainException("角色编码以大写字母开头，仅含大写字母数字下划线，长度3-30");
        }
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RoleCode that)) return false;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
