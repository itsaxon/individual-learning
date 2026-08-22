package com.individuallearning.adapter.common;

import com.individuallearning.infrastructure.context.UserContext;
import com.individuallearning.infrastructure.id.SnowflakeIdGenerator;
import com.individuallearning.infrastructure.persistence.entity.OperationLogPO;
import com.individuallearning.infrastructure.persistence.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * 操作日志切面：拦截 @OperationLog 标注的方法，异步写入操作日志。
 * <p>
 * 记录操作人、模块、类型、方法、参数、耗时、是否成功、异常信息。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;
    private final SnowflakeIdGenerator snowflakeIdGenerator;

    @Around("@annotation(operationLog)")
    public Object around(ProceedingJoinPoint joinPoint, OperationLog operationLog) throws Throwable {
        long startTime = System.currentTimeMillis();
        boolean success = true;
        String errorMessage = null;

        try {
            return joinPoint.proceed();
        } catch (Throwable e) {
            success = false;
            errorMessage = e.getMessage();
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            saveLogAsync(joinPoint, operationLog, duration, success, errorMessage);
        }
    }

    @Async
    public void saveLogAsync(ProceedingJoinPoint joinPoint, OperationLog operationLog,
                             long duration, boolean success, String errorMessage) {
        try {
            OperationLogPO logPO = new OperationLogPO();
            logPO.setId(snowflakeIdGenerator.nextId());
            logPO.setOperator(UserContext.getUserId());
            logPO.setModule(operationLog.module());
            logPO.setType(operationLog.type());
            logPO.setDescription(operationLog.desc());
            logPO.setMethod(joinPoint.getSignature().getDeclaringTypeName() + "." + joinPoint.getSignature().getName());
            logPO.setParams(truncate(Arrays.toString(joinPoint.getArgs())));
            logPO.setDurationMs(duration);
            logPO.setSuccess(success ? 1 : 0);
            logPO.setErrorMsg(errorMessage);
            operationLogMapper.insert(logPO);
        } catch (Exception e) {
            log.error("保存操作日志失败", e);
        }
    }

    private String truncate(String str) {
        if (str == null || str.length() <= 500) {
            return str;
        }
        return str.substring(0, 500) + "...(truncated)";
    }
}
