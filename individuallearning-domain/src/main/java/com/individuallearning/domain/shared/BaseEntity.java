package com.individuallearning.domain.shared;

import java.util.Objects;

/**
 * 实体基类：拥有唯一标识的领域对象，按 id 判等。
 */
public abstract class BaseEntity<I extends Identifier<?>> {

    protected I id;

    public I getId() {
        return id;
    }

    protected void setId(I id) {
        this.id = id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof BaseEntity<?> that)) {
            return false;
        }
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return id == null ? System.identityHashCode(this) : id.hashCode();
    }
}
