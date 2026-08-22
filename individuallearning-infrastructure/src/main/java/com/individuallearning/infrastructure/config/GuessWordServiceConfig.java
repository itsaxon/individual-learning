package com.individuallearning.infrastructure.config;

import com.individuallearning.domain.guessword.repository.WordVectorRepository;
import com.individuallearning.domain.guessword.service.GuessWordDomainService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 猜词领域服务装配：领域层为纯 POJO，统一在此处注入端口依赖、注册为 Spring Bean。
 *
 * @author liushuozhen
 * @version v1.0 2026/07/11
 */
@Configuration
public class GuessWordServiceConfig {

    @Bean
    public GuessWordDomainService guessWordDomainService(WordVectorRepository wordVectorRepository) {
        return new GuessWordDomainService(wordVectorRepository);
    }
}
