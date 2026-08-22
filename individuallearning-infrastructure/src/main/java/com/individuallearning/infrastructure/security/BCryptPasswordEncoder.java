package com.individuallearning.infrastructure.security;

import cn.hutool.crypto.digest.BCrypt;
import com.individuallearning.domain.system.service.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 密码编码器实现：基于 Hutool 的 BCrypt 算法。
 */
@Component
public class BCryptPasswordEncoder implements PasswordEncoder {

    @Override
    public String encode(String rawPassword) {
        return BCrypt.hashpw(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        return BCrypt.checkpw(rawPassword, encodedPassword);
    }
}
