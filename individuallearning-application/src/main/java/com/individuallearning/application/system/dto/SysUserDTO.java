package com.individuallearning.application.system.dto;

import java.time.Instant;

/**
 * 用户视图数据
 */
public record SysUserDTO(Long id, String username, String email, String nickname,
                         Integer status, Instant createTime) {
}
