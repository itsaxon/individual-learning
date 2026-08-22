package com.individuallearning.infrastructure.config;

import com.individuallearning.domain.auth.service.AuthDomainService;
import com.individuallearning.domain.shared.IdGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 认证领域服务装配：领域层为纯 POJO，统一在此处注入端口依赖、注册为 Spring Bean。
 */
@Configuration
public class AuthServiceConfig {

    @Bean
    public AuthDomainService authDomainService(IdGenerator idGenerator) {
        return new AuthDomainService(idGenerator);
    }
}
