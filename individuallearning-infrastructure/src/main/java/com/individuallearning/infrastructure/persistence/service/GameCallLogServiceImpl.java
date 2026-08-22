package com.individuallearning.infrastructure.persistence.service;

import com.individuallearning.infrastructure.persistence.entity.GameCallLogPO;
import com.individuallearning.infrastructure.persistence.mapper.GameCallLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 游戏调用日志服务实现：通过 {@code gameCallLogExecutor} 异步线程池落库。
 * <p>
 * 任何异常仅打 warn 日志，不影响主业务流程。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GameCallLogServiceImpl implements GameCallLogService {

    private final GameCallLogMapper gameCallLogMapper;

    @Override
    @Async("gameCallLogExecutor")
    public void asyncLog(String game, String gameName, String operation,
                         String clientIp, String path, String method,
                         String params, Long durationMs, boolean success,
                         String errorMsg, String userAgent) {
        try {
            GameCallLogPO po = new GameCallLogPO();
            po.setGame(game);
            po.setGameName(gameName);
            po.setOperation(operation);
            po.setClientIp(clientIp);
            po.setPath(path);
            po.setMethod(method);
            po.setParams(params);
            po.setDurationMs(durationMs);
            po.setSuccess(success ? 1 : 0);
            po.setErrorMsg(errorMsg);
            po.setUserAgent(userAgent);
            // createTime 由 MyBatis-Plus 自动填充
            gameCallLogMapper.insert(po);
        } catch (Exception e) {
            log.warn("记录游戏调用日志失败 game={} operation={} ip={}: {}",
                    game, operation, clientIp, e.getMessage());
        }
    }
}
