package com.individuallearning.application.permission.assembler;

import com.individuallearning.application.permission.dto.RoleDTO;
import com.individuallearning.domain.permission.model.aggregate.Role;

import java.util.Comparator;
import java.util.List;

/**
 * 角色应用层装配器：聚合 <-> DTO 转换，隔离领域模型与对外视图。
 */
public class RoleAssembler {

    private RoleAssembler() {
    }

    public static RoleDTO toDTO(Role role) {
        if (role == null) {
            return null;
        }
        List<Long> permissionIds = role.getPermissions().stream()
                .map(pid -> pid.getValue())
                .sorted(Comparator.naturalOrder())
                .collect(java.util.stream.Collectors.toList());
        return new RoleDTO(
                role.getId().getValue(),
                role.getCode().getValue(),
                role.getName(),
                role.getDescription(),
                role.getStatus().getCode(),
                permissionIds,
                role.getCreateTime()
        );
    }
}
