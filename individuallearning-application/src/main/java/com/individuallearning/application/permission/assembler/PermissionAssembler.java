package com.individuallearning.application.permission.assembler;

import com.individuallearning.application.permission.dto.PermissionDTO;
import com.individuallearning.domain.permission.model.aggregate.Permission;

/**
 * 权限应用层装配器：聚合 <-> DTO 转换，隔离领域模型与对外视图。
 */
public class PermissionAssembler {

    private PermissionAssembler() {
    }

    public static PermissionDTO toDTO(Permission permission) {
        if (permission == null) {
            return null;
        }
        return new PermissionDTO(
                permission.getId().getValue(),
                permission.getCode().getValue(),
                permission.getName(),
                permission.getType().getCode(),
                permission.getParentId(),
                permission.getSort(),
                permission.getStatus().getCode(),
                permission.getCreateTime()
        );
    }
}
