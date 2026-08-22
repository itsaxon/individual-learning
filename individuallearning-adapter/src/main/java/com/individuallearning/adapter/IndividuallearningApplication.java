package com.individuallearning.adapter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 系统启动引导类。
 * 扫描范围覆盖 com.individuallearning 下全部模块（adapter / application / infrastructure），
 * 从而把 Repository 实现、领域服务 Bean、配置等统一纳入 Spring 容器。
 * <p>
 * {@code @MapperScan} 配置在 {@code MyBatisPlusConfig} 上，避免 {@code @WebMvcTest} 切片测试加载 Mapper。
 */
@EnableAsync
@SpringBootApplication(scanBasePackages = "com.individuallearning")
public class IndividuallearningApplication {

    public static void main(String[] args) {
        SpringApplication.run(IndividuallearningApplication.class, args);
    }
}
