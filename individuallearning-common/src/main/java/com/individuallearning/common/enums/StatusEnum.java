package com.individuallearning.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 通用启停状态
 */
@Getter
@AllArgsConstructor
public enum StatusEnum implements CodeEnum {

    ENABLE(1, "启用"),
    DISABLE(0, "停用");

    private final int code;
    private final String desc;

    public boolean isEnabled() {
        return this == ENABLE;
    }
}
