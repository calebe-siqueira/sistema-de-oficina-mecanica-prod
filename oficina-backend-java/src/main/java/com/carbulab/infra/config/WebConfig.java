package com.carbulab.infra.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.carbulab.infra.security.TermosDeUsoInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final TermosDeUsoInterceptor termosDeUsoInterceptor;

    public WebConfig(TermosDeUsoInterceptor termosDeUsoInterceptor) {
        this.termosDeUsoInterceptor = termosDeUsoInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(termosDeUsoInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**", "/api/termos/**");
    }
}
