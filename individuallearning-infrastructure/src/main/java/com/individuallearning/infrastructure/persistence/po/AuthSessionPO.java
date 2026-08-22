package com.individuallearning.infrastructure.persistence.po;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

/**
 * 认证会话持久化对象：与数据库表一一对应，仅属于基础设施层，不向领域层泄露。
 */
@Data
@TableName("auth_session")
public class AuthSessionPO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 主键（领域层预生成的雪花 ID） */
    @TableId(type = IdType.INPUT)
    private Long id;

    private Long userId;

    private String accessToken;

    private String refreshToken;

    private Integer status;

    private String loginIp;

    private Instant loginTime;

    private Instant expireTime;

    private Instant refreshExpireTime;

    /** 逻辑删除标记 */
    @TableLogic
    private Integer deleted;

    /** 创建人 ID */
    @TableField(fill = FieldFill.INSERT)
    private Long creator;

    /** 更新人 ID */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updater;

    /** 备注 */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private Instant createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Instant updateTime;
}
