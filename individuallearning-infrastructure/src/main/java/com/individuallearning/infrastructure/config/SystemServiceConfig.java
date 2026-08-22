package com.individuallearning.infrastructure.config;

import com.individuallearning.domain.shared.IdGenerator;
import com.individuallearning.domain.system.repository.SysUserRepository;
import com.individuallearning.domain.system.service.SysUserDomainService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 系统领域服务装配：领域层为纯 POJO，统一在此处注入端口依赖、注册为 Spring Bean。
 */
@Configuration
public class SystemServiceConfig {

    @Bean
    public SysUserDomainService sysUserDomainService(SysUserRepository userRepository, IdGenerator idGenerator) {
        return new SysUserDomainService(userRepository, idGenerator);
    }
}
