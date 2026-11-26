package com.carbulab.dto.cliente;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para alteração de senha pelo cliente no seu perfil.
 */
public record AlterarMinhaSenhaDTO(
    @NotBlank(message = "A senha atual é obrigatória.")
    String senha_atual,

    @NotBlank(message = "A nova senha é obrigatória.")
    String nova_senha,

    @NotBlank(message = "A confirmação da nova senha é obrigatória.")
    String confirmacao_nova_senha
) {}
