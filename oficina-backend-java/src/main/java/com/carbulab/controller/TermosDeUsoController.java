package com.carbulab.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.termo.AceitarTermosDTO;
import com.carbulab.dto.termo.ResponseAceitacaoTermosDTO;
import com.carbulab.dto.termo.StatusTermosDTO;
import com.carbulab.dto.termo.TermosDeUsoDTO;
import com.carbulab.service.TermosDeUsoService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Controller responsável pela disponibilização e gerenciamento do aceite dos termos de uso
 * e políticas de privacidade da plataforma Carbulab.
 */
@RestController
@RequestMapping("/api/termos")
public class TermosDeUsoController {

    private final TermosDeUsoService termosDeUsoService;

    public TermosDeUsoController(TermosDeUsoService termosDeUsoService) {
        this.termosDeUsoService = termosDeUsoService;
    }

    /**
     * Retorna a versão vigente e o conteúdo dos termos de uso da aplicação.
     * Endpoint aberto para consulta pública ou autenticada.
     */
    @GetMapping("/atual")
    public ResponseEntity<TermosDeUsoDTO> obterTermoAtual() {
        TermosDeUsoDTO termoAtual = termosDeUsoService.obterTermoAtual();
        return ResponseEntity.ok(termoAtual);
    }

    /**
     * Retorna o status de aceitação dos termos de uso do usuário autenticado.
     */
    @GetMapping("/status")
    public ResponseEntity<StatusTermosDTO> obterStatusTermos() {
        Usuario usuario = getUsuarioAutenticado();
        StatusTermosDTO status = termosDeUsoService.obterStatus(usuario);
        return ResponseEntity.ok(status);
    }

    /**
     * Registra o aceite ou a recusa dos termos de uso pelo usuário autenticado,
     * capturando dados de auditoria (endereço IP e User-Agent) em conformidade com as
     * melhores práticas de segurança e privacidade (LGPD).
     */
    @PostMapping("/aceitar")
    public ResponseEntity<ResponseAceitacaoTermosDTO> registrarRespostaTermos(
            @RequestBody @Valid AceitarTermosDTO dto,
            HttpServletRequest request) {

        Usuario usuario = getUsuarioAutenticado();
        String ip = extrairIpRequisicao(request);
        String userAgent = request.getHeader("User-Agent");

        ResponseAceitacaoTermosDTO response = termosDeUsoService.registrarAceiteOuRecusa(
                usuario,
                dto,
                ip,
                userAgent
        );

        return ResponseEntity.ok(response);
    }

    private Usuario getUsuarioAutenticado() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Usuario usuario) {
            return usuario;
        }
        throw new IllegalStateException("Usuário autenticado não encontrado na sessão.");
    }

    private String extrairIpRequisicao(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
