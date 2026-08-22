package com.individuallearning.infrastructure.config;

import com.individuallearning.domain.permission.repository.PermissionRepository;
import com.individuallearning.domain.permission.repository.RoleRepository;
import com.individuallearning.domain.permission.service.PermissionDomainService;
import com.individuallearning.domain.shared.IdGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 权限领域服务装配：领域层为纯 POJO，统一在此处注入端口依赖、注册为 Spring Bean。
 */
@Configuration
public class PermissionServiceConfig {

    @Bean
    public PermissionDomainService permissionDomainService(RoleRepository roleRepository,
                                                           PermissionRepository permissionRepository,
                                                           IdGenerator idGenerator) {
        return new PermissionDomainService(roleRepository, permissionRepository, idGenerator);
    }
}
