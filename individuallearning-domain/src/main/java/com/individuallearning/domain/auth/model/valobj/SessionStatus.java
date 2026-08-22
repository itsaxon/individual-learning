package com.individuallearning.domain.auth.model.valobj;

import com.individuallearning.common.exception.DomainException;

import java.io.Serializable;
import java.util.Objects;

/**
 * 会话状态值对象：聚合根对外暴露状态变更行为，避免直接 set。
 * 状态码：ACTIVE=1, REVOKED=2, EXPIRED=0
 */
public final class SessionStatus implements Serializable {

    public static final int CODE_ACTIVE = 1;
    public static final int CODE_REVOKED = 2;
    public static final int CODE_EXPIRED = 0;

    private final int code;

    private SessionStatus(int code) {
        this.code = code;
    }

    public static SessionStatus of(int code) {
        return new SessionStatus(code);
    }

    public static SessionStatus active() {
        return new SessionStatus(CODE_ACTIVE);
    }

    public static SessionStatus revoked() {
        return new SessionStatus(CODE_REVOKED);
    }

    public static SessionStatus expired() {
        return new SessionStatus(CODE_EXPIRED);
    }

    public int getCode() {
        return code;
    }

    public boolean isActive() {
        return code == CODE_ACTIVE;
    }

    /** 切换为撤销，若不是 active 状态（含已撤销、已过期）抛领域异常 */
    public SessionStatus revoke() {
        if (!isActive()) {
            throw new DomainException("会话已失效，无法撤销");
        }
        return revoked();
    }

    public boolean isRevoked() {
        return code == CODE_REVOKED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SessionStatus that)) return false;
        return code == that.code;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }

    @Override
    public String toString() {
        return "SessionStatus{code=" + code + '}';
    }
}
