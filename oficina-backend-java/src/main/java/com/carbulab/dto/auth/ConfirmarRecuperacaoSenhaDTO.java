package com.carbulab.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para confirmação da recuperação de senha com código e definição da nova senha.
 */
public record ConfirmarRecuperacaoSenhaDTO(
    @NotBlank(message = "O e-mail ou login é obrigatório.")
    String email_ou_login,

    @NotBlank(message = "O código de verificação é obrigatório.")
    String codigo,

    @NotBlank(message = "A nova senha é obrigatória.")
    String nova_senha
) {}
