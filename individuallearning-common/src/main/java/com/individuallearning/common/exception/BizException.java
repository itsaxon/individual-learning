package com.individuallearning.common.exception;

import com.individuallearning.common.api.ResponseCode;
import lombok.Getter;

import java.io.Serial;

/**
 * 业务异常：用于应用层/接口层抛出的可预期业务错误
 */
@Getter
public class BizException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    private final int code;

    public BizException(String message) {
        super(message);
        this.code = ResponseCode.FAIL.getCode();
    }

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(ResponseCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public BizException(ResponseCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }
}
