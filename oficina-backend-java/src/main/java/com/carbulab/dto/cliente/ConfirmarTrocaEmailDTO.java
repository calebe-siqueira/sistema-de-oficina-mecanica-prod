package com.carbulab.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO para confirmação da troca de e-mail com o código de 6 dígitos enviado para o novo e-mail.
 */
public record ConfirmarTrocaEmailDTO(
    @NotBlank(message = "O novo e-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    String novo_email,

    @NotBlank(message = "O código de verificação é obrigatório.")
    String codigo
) {}
