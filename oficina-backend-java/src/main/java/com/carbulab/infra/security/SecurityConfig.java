package com.carbulab.infra.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuração de segurança da aplicação (Spring Security 6+).
 *
 * A autenticação é feita manualmente via JWT no ApiController,
 * portanto o Spring Security é configurado para:
 *   - Desabilitar CSRF (API stateless não usa sessão/cookie)
 *   - Desabilitar a sessão HTTP (stateless)
 *   - Permitir todas as requisições (a validação do token JWT é responsabilidade do ApiController)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final SecurityFilter securityFilter;

    public SecurityConfig(SecurityFilter securityFilter) {
        this.securityFilter = securityFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
            .cors(org.springframework.security.config.Customizer.withDefaults()) // Integra com a configuração WebMvcConfigurer
            .csrf(csrf -> csrf.disable()) // Desabilita proteção CSRF
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Define política de sessão como STATELESS (sem guardar estado na memória do servidor, utilizando apenas o token para autenticação)
            
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll() // Permite POST em login, refresh e logout sem token
                .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("ADMIN")
                .anyRequest().authenticated() // Todas as outras requisições precisam de token
            )
            .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
            
            .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() { // Responsável por criptografar senhas
        return new BCryptPasswordEncoder();
    }
}
