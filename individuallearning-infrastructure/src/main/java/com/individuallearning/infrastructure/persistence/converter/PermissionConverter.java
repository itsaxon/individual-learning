package com.individuallearning.infrastructure.persistence.converter;

import com.individuallearning.domain.permission.model.aggregate.Permission;
import com.individuallearning.domain.permission.model.valobj.PermissionCode;
import com.individuallearning.domain.permission.model.valobj.PermissionId;
import com.individuallearning.domain.permission.model.valobj.PermissionType;
import com.individuallearning.infrastructure.persistence.po.PermissionPO;

import java.time.Instant;

/**
 * 权限 PO 与领域聚合互转：隔离持久化结构与领域模型。
 */
public class PermissionConverter {

    private PermissionConverter() {
    }

    /** 聚合 -> PO（时间字段由 MetaObjectHandler 维护） */
    public static PermissionPO toPO(Permission permission) {
        if (permission == null) {
            return null;
        }
        PermissionPO po = new PermissionPO();
        po.setId(permission.getId().getValue());
        po.setCode(permission.getCode().getValue());
        po.setName(permission.getName());
        po.setType(permission.getType().getCode());
        po.setParentId(permission.getParentId());
        po.setSort(permission.getSort());
        po.setStatus(permission.getStatus().getCode());
        return po;
    }

    /** PO -> 聚合（重建） */
    public static Permission toDomain(PermissionPO po) {
        if (po == null) {
            return null;
        }
        return Permission.reconstitute(
                new PermissionId(po.getId()),
                new PermissionCode(po.getCode()),
                po.getName(),
                PermissionType.of(po.getType()),
                po.getParentId(),
                po.getSort(),
                po.getStatus(),
                po.getCreateTime(),
                po.getUpdateTime()
        );
    }
}
