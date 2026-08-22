CREATE TABLE IF NOT EXISTS `game_call_log` (
    `id` BIGINT NOT NULL COMMENT '主键ID',
    `game` VARCHAR(64) NOT NULL COMMENT '游戏标识',
    `game_name` VARCHAR(64) NOT NULL COMMENT '游戏中文名',
    `operation` VARCHAR(64) NOT NULL COMMENT '操作类型',
    `client_ip` VARCHAR(128) NOT NULL COMMENT '客户端IP',
    `path` VARCHAR(256) DEFAULT NULL COMMENT '请求路径',
    `method` VARCHAR(16) DEFAULT NULL COMMENT 'HTTP方法',
    `params` TEXT COMMENT '请求参数JSON',
    `duration_ms` BIGINT DEFAULT NULL COMMENT '耗时毫秒',
    `success` TINYINT NOT NULL DEFAULT 1 COMMENT '1成功 0失败',
    `error_msg` TEXT COMMENT '错误信息',
    `user_agent` VARCHAR(512) DEFAULT NULL COMMENT '客户端UA',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    INDEX `idx_game` (`game`),
    INDEX `idx_client_ip` (`client_ip`),
    INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏调用日志表';
