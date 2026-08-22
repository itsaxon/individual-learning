package com.individuallearning.common.api;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 统一 API 响应结构
 * <p>
 * 所有接口返回统一格式：{@code {code, message, data, timestamp}}
 * <ul>
 *   <li>{@code code}：0=成功，非 0=失败（详见 {@link ResponseCode}）</li>
 *   <li>{@code message}：描述信息</li>
 *   <li>{@code data}：业务数据</li>
 *   <li>{@code timestamp}：响应时间戳（毫秒），便于排查问题</li>
 * </ul>
 */
@Data
public class ApiResponse<T> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 响应码：0=成功，非 0=失败 */
    private int code;
    /** 描述 */
    private String message;
    /** 业务数据 */
    private T data;
    /** 响应时间戳（毫秒） */
    private long timestamp;

    private ApiResponse() {
        this.timestamp = System.currentTimeMillis();
    }

    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    /** 成功（无数据） */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(ResponseCode.SUCCESS.getCode(), ResponseCode.SUCCESS.getMessage(), null);
    }

    /** 成功（带数据） */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(ResponseCode.SUCCESS.getCode(), ResponseCode.SUCCESS.getMessage(), data);
    }

    /** 失败（指定响应码） */
    public static <T> ApiResponse<T> fail(ResponseCode resultCode) {
        return new ApiResponse<>(resultCode.getCode(), resultCode.getMessage(), null);
    }

    /** 失败（自定义 code 和 message） */
    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    /** 失败（指定响应码 + 自定义 message） */
    public static <T> ApiResponse<T> fail(ResponseCode resultCode, String message) {
        return new ApiResponse<>(resultCode.getCode(), message, null);
    }

    /** 是否成功 */
    public boolean isSuccess() {
        return this.code == ResponseCode.SUCCESS.getCode();
    }
}
