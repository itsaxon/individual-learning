package com.individuallearning.infrastructure.persistence.entity;

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
 * 游戏调用日志持久化对象：精确记录"什么 IP 玩了什么游戏"。
 * 与 game_call_log 表一一对应。
 */
@Data
@TableName("game_call_log")
public class GameCallLogPO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 主键（雪花 ID，MyBatis-Plus 自动分配） */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 游戏标识（如 impostor / guessword） */
    private String game;

    /** 游戏中文名（如 找出冒牌货 / 词海寻踪） */
    private String gameName;

    /** 操作类型（如 create_room / join_room / similarity） */
    private String operation;

    /** 客户端真实 IP（支持 IPv4/IPv6） */
    private String clientIp;

    /** 请求路径 */
    private String path;

    /** HTTP 方法（GET/POST） */
    private String method;

    /** 请求参数 JSON */
    private String params;

    /** 耗时毫秒 */
    private Long durationMs;

    /** 是否成功：1成功 0失败 */
    private Integer success;

    /** 错误信息 */
    private String errorMsg;

    /** 客户端 User-Agent */
    private String userAgent;

    /** 创建时间（MyBatis-Plus 自动填充） */
    @TableField(fill = FieldFill.INSERT)
    private Instant createTime;
}
