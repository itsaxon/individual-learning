package com.individuallearning.domain.system.model.valobj;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * 用户名值对象：封装命名规则，不可变。
 */
public final class Username implements Serializable {

    private static final Pattern PATTERN = Pattern.compile("^[a-zA-Z][a-zA-Z0-9_]{2,19}$");

    private final String value;

    public Username(String value) {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new DomainException("用户名以字母开头，仅含字母数字下划线，长度3-20");
        }
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Username that)) return false;
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
