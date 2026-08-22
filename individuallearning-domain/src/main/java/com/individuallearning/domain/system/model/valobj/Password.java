package com.individuallearning.domain.system.model.valobj;

import com.individuallearning.common.exception.DomainException;
import com.individuallearning.domain.system.service.PasswordEncoder;

import java.io.Serializable;
import java.util.Objects;

/**
 * 密码值对象：内部保存已编码值，不可变。
 * 明文校验规则与编码都通过端口完成，领域层不感知具体加密算法。
 */
public final class Password implements Serializable {

    private final String encodedValue;

    private Password(String encodedValue) {
        this.encodedValue = encodedValue;
    }

    /**
     * 由明文密码构造：先校验规则，再通过编码器端口加密
     */
    public static Password encode(String rawPassword, PasswordEncoder encoder) {
        validate(rawPassword);
        return new Password(encoder.encode(rawPassword));
    }

    /**
     * 由已编码值直接构造（用于从持久化恢复聚合）
     */
    public static Password ofEncoded(String encodedValue) {
        if (encodedValue == null || encodedValue.isBlank()) {
            throw new DomainException("密码不能为空");
        }
        return new Password(encodedValue);
    }

    private static void validate(String rawPassword) {
        if (rawPassword == null || rawPassword.length() < 8 || rawPassword.length() > 32) {
            throw new DomainException("密码长度需在8-32位之间");
        }
        if (!rawPassword.matches(".*[A-Za-z].*") || !rawPassword.matches(".*\\d.*")) {
            throw new DomainException("密码必须包含字母和数字");
        }
    }

    /**
     * 校验明文是否匹配
     */
    public boolean matches(String rawPassword, PasswordEncoder encoder) {
        return encoder.matches(rawPassword, encodedValue);
    }

    public String getEncodedValue() {
        return encodedValue;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Password that)) return false;
        return Objects.equals(encodedValue, that.encodedValue);
    }

    @Override
    public int hashCode() {
        return Objects.hash(encodedValue);
    }
}
