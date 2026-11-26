package com.carbulab.infra.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.exception.TermosNaoAceitosException;
import com.carbulab.service.TermosDeUsoService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Interceptor responsável por garantir que nenhum usuário utilize as funcionalidades
 * operacionais ou administrativas do sistema sem ter aceitado os termos de uso vigentes.
 */
@Component
public class TermosDeUsoInterceptor implements HandlerInterceptor {

    private final TermosDeUsoService termosDeUsoService;

    public TermosDeUsoInterceptor(TermosDeUsoService termosDeUsoService) {
        this.termosDeUsoService = termosDeUsoService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Permite requisições prévias de CORS (OPTIONS)
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();

        // Rotas liberadas para usuários que ainda não aceitaram os termos:
        // Autenticação (/api/auth/**), gestão de termos (/api/termos/**) e páginas de erro (/error)
        if (isRotaIsentaDeTermos(path)) {
            return true;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Requisições não autenticadas são tratadas pelo Spring Security
            return true;
        }

        if (auth.getPrincipal() instanceof Usuario usuario) {
            boolean aceito = termosDeUsoService.isTermosAceitos(usuario);
            if (!aceito) {
                throw new TermosNaoAceitosException("É necessário aceitar os termos de uso para utilizar o sistema.");
            }
        }

        return true;
    }

    private boolean isRotaIsentaDeTermos(String path) {
        if (path == null) {
            return true;
        }
        return path.startsWith("/api/auth/")
                || path.startsWith("/api/termos/")
                || path.startsWith("/error")
                || path.equals("/favicon.ico");
    }
}
