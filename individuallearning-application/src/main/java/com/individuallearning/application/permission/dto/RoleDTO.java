package com.individuallearning.application.permission.dto;

import java.time.Instant;
import java.util.List;

/**
 * 角色视图数据
 */
public record RoleDTO(Long id, String code, String name, String description, Integer status,
                      List<Long> permissionIds, Instant createTime) {
}
