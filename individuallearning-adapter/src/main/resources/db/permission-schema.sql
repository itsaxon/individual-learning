-- 权限领域建表脚本（领域：permission）
-- 角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
    `id`          BIGINT       NOT NULL                 COMMENT '主键(雪花ID,领域预生成)',
    `code`        VARCHAR(32)  NOT NULL                 COMMENT '角色编码',
    `name`        VARCHAR(64)  NOT NULL                 COMMENT '角色名称',
    `description` VARCHAR(255) DEFAULT NULL             COMMENT '描述',
    `status`      TINYINT      NOT NULL DEFAULT 1       COMMENT '状态:1启用 0禁用',
    `deleted`     TINYINT      NOT NULL DEFAULT 0       COMMENT '逻辑删除:0未删 1已删',
    `creator`     BIGINT       NOT NULL DEFAULT 0       COMMENT '创建人ID',
    `updater`     BIGINT       NOT NULL DEFAULT 0       COMMENT '更新人ID',
    `remark`      VARCHAR(500) DEFAULT NULL             COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                            COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS `sys_permission` (
    `id`          BIGINT       NOT NULL                 COMMENT '主键(雪花ID,领域预生成)',
    `code`        VARCHAR(64)  NOT NULL                 COMMENT '权限编码',
    `name`        VARCHAR(64)  NOT NULL                 COMMENT '权限名称',
    `type`        TINYINT      NOT NULL                 COMMENT '类型:1菜单 2按钮 3API',
    `parent_id`   BIGINT       DEFAULT NULL             COMMENT '父级ID',
    `sort`        INT          NOT NULL DEFAULT 0       COMMENT '排序',
    `status`      TINYINT      NOT NULL DEFAULT 1       COMMENT '状态:1启用 0禁用',
    `deleted`     TINYINT      NOT NULL DEFAULT 0       COMMENT '逻辑删除:0未删 1已删',
    `creator`     BIGINT       NOT NULL DEFAULT 0       COMMENT '创建人ID',
    `updater`     BIGINT       NOT NULL DEFAULT 0       COMMENT '更新人ID',
    `remark`      VARCHAR(500) DEFAULT NULL             COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                            COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='权限表';

-- 角色-权限关联表
CREATE TABLE IF NOT EXISTS `sys_role_permission` (
    `id`            BIGINT   NOT NULL                   COMMENT '主键(雪花ID,领域预生成)',
    `role_id`       BIGINT   NOT NULL                   COMMENT '角色ID',
    `permission_id` BIGINT   NOT NULL                   COMMENT '权限ID',
    `create_time`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_permission_id` (`permission_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='角色权限关联表';

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
    `id`          BIGINT   NOT NULL                     COMMENT '主键(雪花ID,领域预生成)',
    `user_id`     BIGINT   NOT NULL                     COMMENT '用户ID',
    `role_id`     BIGINT   NOT NULL                     COMMENT '角色ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='用户角色关联表';
