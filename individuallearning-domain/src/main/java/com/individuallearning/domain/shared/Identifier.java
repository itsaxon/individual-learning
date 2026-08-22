package com.individuallearning.domain.shared;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;

/**
 * 标识值对象基类：领域中的唯一标识（如 UserId）应继承本类。
 * 值对象按 value 进行相等性比较。
 */
public abstract class Identifier<T extends Serializable> implements Serializable {

    private final T value;

    protected Identifier(T value) {
        if (value == null) {
            throw new DomainException("标识值不能为空");
        }
        this.value = value;
    }

    public T getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Identifier<?> that)) {
            return false;
        }
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}
