package com.carbulab.dto.cliente;

/**
 * DTO para consulta do status de acesso do cliente.
 */
public record StatusAcessoClienteDTO(
    boolean temAcesso,
    String login,
    String email
) {}
