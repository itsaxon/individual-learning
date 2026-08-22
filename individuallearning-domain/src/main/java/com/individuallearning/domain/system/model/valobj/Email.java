package com.individuallearning.domain.system.model.valobj;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * 邮箱值对象：不可变，构造时校验格式。
 */
public final class Email implements Serializable {

    private static final Pattern PATTERN = Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    private final String value;

    public Email(String value) {
        if (value == null || !PATTERN.matcher(value).matches()) {
            throw new DomainException("邮箱格式不正确");
        }
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Email that)) return false;
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
