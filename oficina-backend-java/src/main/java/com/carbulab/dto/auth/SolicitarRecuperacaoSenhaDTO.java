package com.carbulab.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para solicitação de código de recuperação de senha.
 */
public record SolicitarRecuperacaoSenhaDTO(
    @NotBlank(message = "O e-mail ou login é obrigatório.")
    String email_ou_login
) {}
