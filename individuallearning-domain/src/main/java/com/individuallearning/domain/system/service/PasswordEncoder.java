package com.individuallearning.domain.system.service;

/**
 * 密码编码器端口：领域层定义，基础设施层提供 BCrypt 等实现。
 */
public interface PasswordEncoder {

    /**
     * 对明文密码进行编码
     */
    String encode(String rawPassword);

    /**
     * 校验明文密码与已编码密码是否匹配
     */
    boolean matches(String rawPassword, String encodedPassword);
}
