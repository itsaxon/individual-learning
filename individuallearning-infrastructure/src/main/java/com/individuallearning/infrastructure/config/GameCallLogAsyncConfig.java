package com.individuallearning.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 游戏调用日志异步线程池配置。
 * <p>
 * 使用独立线程池 {@code gameCallLogExecutor} 与业务线程池隔离，
 * 拒绝策略采用 CallerRunsPolicy：队列满时由调用线程同步执行，确保日志不丢。
 */
@Configuration
@EnableAsync
public class GameCallLogAsyncConfig {

    @Bean(name = "gameCallLogExecutor")
    public Executor gameCallLogExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("game-log-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
