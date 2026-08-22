package com.individuallearning.common.exception;

import com.individuallearning.common.api.ResponseCode;
import lombok.Getter;

import java.io.Serial;

/**
 * 领域异常：领域层业务规则被破坏时抛出，不依赖任何基础设施
 */
@Getter
public class DomainException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    private final int code;

    public DomainException(String message) {
        super(message);
        this.code = ResponseCode.FAIL.getCode();
    }

    public DomainException(int code, String message) {
        super(message);
        this.code = code;
    }

    public DomainException(ResponseCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public DomainException(ResponseCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }
}
