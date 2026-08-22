package com.individuallearning.domain.permission.model.valobj;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * 权限编码值对象：不可变，构造时校验格式。
 */
public final class PermissionCode implements Serializable {

    private static final Pattern PATTERN = Pattern.compile("^[a-z][a-z0-9:._-]{2,63}$");

    private final String value;

    public PermissionCode(String value) {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new DomainException("权限编码以小写字母开头，仅含小写字母数字和 : . _ - 符号，长度3-64");
        }
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PermissionCode that)) return false;
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
