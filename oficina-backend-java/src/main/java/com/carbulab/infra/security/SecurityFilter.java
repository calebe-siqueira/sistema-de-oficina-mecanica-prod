package com.carbulab.infra.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.carbulab.repositories.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import com.carbulab.domain.usuario.Usuario;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;

    public SecurityFilter(TokenService tokenService, UsuarioRepository usuarioRepository) {
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        var token = this.recoverToken(request);

        if (token != null) {
            try {
                var login = this.tokenService.validateToken(token, "access");
                authenticateUser(login);
            } catch (Exception e) {
                // Access token inválido ou expirado. Tenta fazer o refresh transparente.
                String refreshToken = this.recoverCookie(request, "refreshToken");
                if (refreshToken != null) {
                    try {
                        var login = this.tokenService.validateToken(refreshToken, "refresh");
                        Usuario user = (Usuario) this.usuarioRepository.findByLoginOrEmail(login, login);
                        
                        if (user != null) {
                            // Gera um novo access token
                            String newAccessToken = tokenService.generateToken(user);
                            
                            // Adiciona o novo cookie na resposta da requisição atual
                            ResponseCookie cookie = ResponseCookie.from("accessToken", newAccessToken)
                                .httpOnly(true)
                                .secure(true) // true em prod
                                .path("/")
                                .maxAge(tokenService.getAccessTokenExpirationSeconds())
                                .sameSite("Lax")
                                .build();
                                
                            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
                            
                            // Autentica o usuário na requisição atual para não falhar (transparente pro frontend)
                            var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    } catch (Exception refreshException) {
                        // Refresh token também é inválido/expirado, o usuário precisará logar novamente.
                    }
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private void authenticateUser(String login) {
        UserDetails user = this.usuarioRepository.findByLoginOrEmail(login, login);
        if (user != null) {
            var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    }

    private String recoverToken(HttpServletRequest request) {
        return recoverCookie(request, "accessToken");
    }

    private String recoverCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

}
