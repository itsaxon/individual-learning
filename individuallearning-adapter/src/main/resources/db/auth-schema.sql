-- 认证会话表（领域：auth）
CREATE TABLE IF NOT EXISTS `auth_session` (
    `id`                 BIGINT       NOT NULL                            COMMENT '主键(雪花ID)',
    `user_id`            BIGINT       NOT NULL                            COMMENT '用户ID',
    `access_token`       VARCHAR(512) NOT NULL                            COMMENT '访问令牌',
    `refresh_token`      VARCHAR(512) NOT NULL                            COMMENT '刷新令牌',
    `status`             TINYINT      NOT NULL DEFAULT 1                  COMMENT '状态:1有效 0过期 2撤销',
    `login_ip`           VARCHAR(64)  DEFAULT NULL                        COMMENT '登录IP',
    `login_time`         DATETIME     NOT NULL                            COMMENT '登录时间',
    `expire_time`        DATETIME     NOT NULL                            COMMENT '访问令牌过期时间',
    `refresh_expire_time` DATETIME    NOT NULL                            COMMENT '刷新令牌过期时间',
    `deleted`            TINYINT      NOT NULL DEFAULT 0                  COMMENT '逻辑删除:0未删 1已删',
    `creator`            BIGINT       NOT NULL DEFAULT 0                  COMMENT '创建人ID',
    `updater`            BIGINT       NOT NULL DEFAULT 0                  COMMENT '更新人ID',
    `remark`             VARCHAR(500) DEFAULT NULL                        COMMENT '备注',
    `create_time`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                              COMMENT '创建时间',
    `update_time`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP       COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_access_token` (`access_token`(255)),
    UNIQUE KEY `uk_refresh_token` (`refresh_token`(255)),
    KEY `idx_user_id` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='认证会话表';
