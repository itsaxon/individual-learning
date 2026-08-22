package com.individuallearning.adapter.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 防重复提交注解：基于 Redis + 请求体哈希实现幂等性。
 * <p>
 * 同一用户（或匿名 IP）在窗口期内重复提交相同请求将被拒绝。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {

    /** 幂等窗口期，默认 5 秒 */
    String window() default "5s";

    /** 提示消息 */
    String message() default "请勿重复提交";
}
