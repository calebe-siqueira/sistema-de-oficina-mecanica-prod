package com.carbulab.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.auth.AuthenticationDTO;
import com.carbulab.dto.auth.ResponseLoginDTO;
import com.carbulab.dto.usuario.CreateUsuarioDTO;
import com.carbulab.dto.usuario.UpdateUsuarioDTO;
import com.carbulab.infra.security.TokenService;
import com.carbulab.service.UsuarioService;
import com.carbulab.repositories.UsuarioRepository;
import com.carbulab.exception.InvalidCredentialsException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    public AuthenticationController(
            AuthenticationManager authenticationManager,
            TokenService tokenService,
            UsuarioService usuarioService,
            UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthenticationDTO authenticationData) {
        try {
            var usernamePassword = new UsernamePasswordAuthenticationToken(authenticationData.login(), authenticationData.senha());
            var auth = this.authenticationManager.authenticate(usernamePassword);

            Usuario usuario = (Usuario) auth.getPrincipal();
            String accessToken = tokenService.generateToken(usuario);
            String refreshToken = tokenService.generateRefreshToken(usuario);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, createCookie("accessToken", accessToken, tokenService.getAccessTokenExpirationSeconds()).toString());
            headers.add(HttpHeaders.SET_COOKIE, createCookie("refreshToken", refreshToken, tokenService.getRefreshTokenExpirationSeconds()).toString());

            var responseBody = new ResponseLoginDTO(
                usuario.getCod_usuario(), 
                usuario.getNome(), 
                usuario.getLogin(), 
                usuario.getFuncao().name()
            );

            return ResponseEntity.ok().headers(headers).body(responseBody);
        } catch (AuthenticationException e) {
            logger.warn("Falha de autenticação (Auditoria): Tentativa de login malsucedida para o usuário '{}'. Motivo: Credenciais inválidas.", authenticationData.login(), e);
            throw new InvalidCredentialsException("Usuário inexistente ou senha inválida");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(401).body("Refresh token não fornecido");
        }

        try {
            String login = tokenService.validateToken(refreshToken, "refresh");
            Usuario usuario = (Usuario) usuarioRepository.findByLoginOrEmail(login, login);
            
            if (usuario == null) {
                return ResponseEntity.status(401).body("Usuário não encontrado");
            }

            String newAccessToken = tokenService.generateToken(usuario);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.SET_COOKIE, createCookie("accessToken", newAccessToken, tokenService.getAccessTokenExpirationSeconds()).toString());

            return ResponseEntity.ok().headers(headers).build();
        } catch (Exception e) {
            logger.warn("Tentativa de uso de refresh token inválido ou expirado.", e);
            return ResponseEntity.status(401).body("Refresh token inválido ou expirado");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, createCookie("accessToken", "", 0).toString());
        headers.add(HttpHeaders.SET_COOKIE, createCookie("refreshToken", "", 0).toString());
        
        return ResponseEntity.ok().headers(headers).build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        Usuario usuario = (Usuario) authentication.getPrincipal();
        var responseBody = new ResponseLoginDTO(
            usuario.getCod_usuario(), 
            usuario.getNome(), 
            usuario.getLogin(), 
            usuario.getFuncao().name()
        );

        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid CreateUsuarioDTO registerData) {
        this.usuarioService.registrarUsuario(registerData);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestBody @Valid UpdateUsuarioDTO updateData) {
        this.usuarioService.atualizarUsuario(updateData);
        return ResponseEntity.ok().build();
    }

    private ResponseCookie createCookie(String name, String value, int maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true) // Mudar para true em produção (requer HTTPS)
                .path("/")
                .maxAge(maxAge)
                .sameSite("None") // Lax permite navegação básica. Strict é melhor para segurança extra contra CSRF.
                .build();
    }

    @GetMapping("/lixeira")
    public ResponseEntity<java.util.List<Usuario>> listarLixeira() {
        return ResponseEntity.ok(usuarioService.listarLixeira());
    }

    @PutMapping("/lixeira/{id}/restaurar")
    public ResponseEntity<Void> restaurar(@PathVariable Long id) {
        usuarioService.restaurar(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lixeira/{id}/permanente")
    public ResponseEntity<Void> deletarPermanentemente(@PathVariable Long id) {
        usuarioService.deletarPermanentemente(id);
        return ResponseEntity.noContent().build();
    }
}
