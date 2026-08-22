package com.individuallearning.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

/**
 * 角色-权限关联持久化对象：物理删除（无逻辑删除字段）。
 */
@Data
@TableName("sys_role_permission")
public class RolePermissionPO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 主键（领域层预生成的雪花 ID） */
    @TableId(type = IdType.INPUT)
    private Long id;

    private Long roleId;

    private Long permissionId;

    @TableField(fill = FieldFill.INSERT)
    private Instant createTime;
}
