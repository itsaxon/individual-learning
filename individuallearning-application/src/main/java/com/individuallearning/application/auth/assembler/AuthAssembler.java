package com.individuallearning.application.auth.assembler;

import com.individuallearning.application.auth.dto.LoginUserDTO;
import com.individuallearning.application.auth.dto.TokenDTO;
import com.individuallearning.domain.auth.model.aggregate.AuthSession;
import com.individuallearning.domain.system.model.aggregate.SysUser;

import java.time.Duration;
import java.time.Instant;

/**
 * 认证应用层装配器：聚合 <-> DTO 转换，隔离领域模型与对外视图。
 */
public class AuthAssembler {

    private AuthAssembler() {
    }

    public static TokenDTO toTokenDTO(AuthSession session, SysUser user) {
        if (session == null) {
            return null;
        }
        long expiresIn = 0L;
        Instant expireTime = session.getExpireTime();
        Instant now = Instant.now();
        if (expireTime != null && expireTime.isAfter(now)) {
            expiresIn = Duration.between(now, expireTime).getSeconds();
        }
        LoginUserDTO userDTO = null;
        if (user != null) {
            userDTO = new LoginUserDTO(
                    user.getId().getValue(),
                    user.getUsername().getValue(),
                    user.getNickname()
            );
        }
        return new TokenDTO(session.getAccessToken(), session.getRefreshToken(), expiresIn, userDTO);
    }
}
