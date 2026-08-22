package com.individuallearning.common.api;

import lombok.Getter;

/**
 * 统一响应码定义
 * <p>
 * 编码规则：0=成功，1xxx=参数类，2xxx=业务类，3xxx=系统类，4xxx=鉴权类
 */
@Getter
public enum ResponseCode {

    SUCCESS(0, "成功"),
    FAIL(2000, "业务失败"),

    // 参数与校验类 1xxx
    PARAM_INVALID(1001, "参数校验失败"),
    PARAM_MISSING(1002, "缺少必填参数"),

    // 系统类 3xxx
    SYSTEM_ERROR(3001, "系统异常"),
    DB_ERROR(3002, "数据库异常"),
    RPC_ERROR(3003, "远程调用异常"),

    // 鉴权类 4xxx
    UNAUTHORIZED(4001, "未登录或登录已过期"),
    FORBIDDEN(4002, "无权限访问");

    private final int code;
    private final String message;

    ResponseCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
