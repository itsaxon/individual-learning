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
 * 操作日志持久化对象：记录用户操作行为，用于审计追溯。
 */
@Data
@TableName("sys_operation_log")
public class OperationLogPO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.INPUT)
    private Long id;

    /** 操作人 ID */
    private Long operator;

    /** 操作模块 */
    private String module;

    /** 操作类型 */
    private String type;

    /** 操作描述 */
    private String description;

    /** 方法全名 */
    private String method;

    /** 请求参数 */
    private String params;

    /** 耗时（毫秒） */
    private Long durationMs;

    /** 是否成功：1成功 0失败 */
    private Integer success;

    /** 错误信息 */
    private String errorMsg;

    /** 逻辑删除 */
    @TableField("deleted")
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private Instant createTime;
}
