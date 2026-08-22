package com.individuallearning.adapter.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 操作日志注解：标记需要记录操作日志的方法。
 * <p>
 * 切面将自动记录操作人、操作类型、方法名、参数、耗时、结果等，
 * 异步写入数据库 sys_operation_log 表。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {

    /** 操作模块 */
    String module();

    /** 操作类型（如 CREATE/UPDATE/DELETE/QUERY） */
    String type();

    /** 操作描述 */
    String desc() default "";
}
