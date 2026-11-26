package com.carbulab.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO para solicitação de troca de e-mail pelo cliente autenticado.
 */
public record SolicitarTrocaEmailDTO(
    @NotBlank(message = "O novo e-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    String novo_email
) {}
