package com.individuallearning.infrastructure.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis Plus 配置：分页插件、Mapper 扫描。
 * <p>
 * {@code @MapperScan} 放在此处而非 {@code IndividuallearningApplication} 上，
 * 使 {@code @WebMvcTest} 切片测试不会触发 Mapper Bean 注册（缺 SqlSessionFactory 报错）。
 */
@Configuration
@MapperScan("com.individuallearning.infrastructure.persistence.mapper")
public class MyBatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
