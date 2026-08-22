-- 操作日志表（审计用）
CREATE TABLE IF NOT EXISTS `sys_operation_log` (
    `id`          BIGINT       NOT NULL                 COMMENT '主键(雪花ID)',
    `operator`    BIGINT       NOT NULL DEFAULT 0       COMMENT '操作人ID',
    `module`      VARCHAR(64)  NOT NULL                 COMMENT '操作模块',
    `type`        VARCHAR(32)  NOT NULL                 COMMENT '操作类型',
    `description` VARCHAR(255) DEFAULT NULL             COMMENT '操作描述',
    `method`      VARCHAR(255) NOT NULL                 COMMENT '方法全名',
    `params`      VARCHAR(500) DEFAULT NULL             COMMENT '请求参数',
    `duration_ms` BIGINT       DEFAULT NULL             COMMENT '耗时(毫秒)',
    `success`     TINYINT      NOT NULL DEFAULT 1       COMMENT '是否成功:1成功 0失败',
    `error_msg`   VARCHAR(500) DEFAULT NULL             COMMENT '错误信息',
    `deleted`     TINYINT      NOT NULL DEFAULT 0       COMMENT '逻辑删除:0正常 1删除',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_operator` (`operator`),
    KEY `idx_module` (`module`),
    KEY `idx_create_time` (`create_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='操作日志表';
