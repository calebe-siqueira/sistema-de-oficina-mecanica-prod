package com.carbulab.dto.cliente;

/**
 * DTO para solicitação de ativação de acesso do cliente.
 * Se a senha for informada, será usada; caso contrário, uma senha temporária segura será gerada automaticamente.
 */
public record AtivarAcessoClienteDTO(
    String senha
) {}
