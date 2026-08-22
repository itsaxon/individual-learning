package com.individuallearning.infrastructure.config;

import com.individuallearning.domain.impostor.service.ImpostorDomainService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 找出冒牌货领域服务装配：领域层为纯 POJO，统一在此处注册为 Spring Bean。
 */
@Configuration
public class ImpostorServiceConfig {

    @Bean
    public ImpostorDomainService impostorDomainService() {
        return new ImpostorDomainService();
    }
}
