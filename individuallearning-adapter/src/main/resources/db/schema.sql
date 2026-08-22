-- 系统用户表（示例领域：system）
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id`          BIGINT       NOT NULL                 COMMENT '主键(雪花ID,领域预生成)',
    `username`    VARCHAR(64)  NOT NULL                 COMMENT '用户名',
    `password`    VARCHAR(128) NOT NULL                 COMMENT '密码(BCrypt加密)',
    `email`       VARCHAR(128) NOT NULL                 COMMENT '邮箱',
    `nickname`    VARCHAR(64)  NOT NULL                 COMMENT '昵称',
    `status`      TINYINT      NOT NULL DEFAULT 1       COMMENT '状态:1启用 0禁用',
    `deleted`     TINYINT      NOT NULL DEFAULT 0       COMMENT '逻辑删除:0未删 1已删',
    `creator`     BIGINT       NOT NULL DEFAULT 0       COMMENT '创建人ID',
    `updater`     BIGINT       NOT NULL DEFAULT 0       COMMENT '更新人ID',
    `remark`      VARCHAR(500) DEFAULT NULL             COMMENT '备注',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                                  COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP       COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='系统用户表';
