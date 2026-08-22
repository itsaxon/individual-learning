package com.individuallearning.infrastructure.persistence.converter;

import com.individuallearning.domain.permission.model.aggregate.Role;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.RoleCode;
import com.individuallearning.domain.permission.model.valobj.RoleId;
import com.individuallearning.infrastructure.persistence.po.RolePO;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 角色 PO 与领域聚合互转：隔离持久化结构与领域模型。
 * toPO 不处理 permissions（关联表单独维护）；toDomain 需要额外的 permissionIds 参数重建权限集合。
 */
public class RoleConverter {

    private RoleConverter() {
    }

    /** 聚合 -> PO（不处理 permissions，时间字段由 MetaObjectHandler 维护） */
    public static RolePO toPO(Role role) {
        if (role == null) {
            return null;
        }
        RolePO po = new RolePO();
        po.setId(role.getId().getValue());
        po.setCode(role.getCode().getValue());
        po.setName(role.getName());
        po.setDescription(role.getDescription());
        po.setStatus(role.getStatus().getCode());
        return po;
    }

    /** PO -> 聚合（重建，需传入 permissionIds 用于重建权限集合） */
    public static Role toDomain(RolePO po, Set<Long> permissionIds) {
        if (po == null) {
            return null;
        }
        Set<PermissionId> permissions = permissionIds == null
                ? java.util.Collections.emptySet()
                : permissionIds.stream().map(PermissionId::new).collect(Collectors.toSet());
        return Role.reconstitute(
                new RoleId(po.getId()),
                new RoleCode(po.getCode()),
                po.getName(),
                po.getDescription(),
                po.getStatus(),
                permissions,
                po.getCreateTime(),
                po.getUpdateTime()
        );
    }
}
