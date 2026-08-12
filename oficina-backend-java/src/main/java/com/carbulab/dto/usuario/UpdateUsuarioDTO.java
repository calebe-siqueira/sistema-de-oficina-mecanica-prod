package com.carbulab.dto.usuario;

import com.carbulab.domain.usuario.UsuarioFuncao;

import jakarta.validation.constraints.NotNull;

/**
 * Record que representa um DTO de atualização de usuário
 * @param id - ID do usuário que será alterado
 * @param nome_usuario - Novo nome do usuário
 * @param email - Novo email do usuário
 * @param login - Novo login do usuário
 * @param senha - Nova senha do usuário (opcional ou obrigatória)
 * @param funcao - Nova função do usuário
 */
public record UpdateUsuarioDTO(
    @NotNull Long cod_usuario,
    String nome_usuario,
    String login,
    String senha,
    String email,
    UsuarioFuncao funcao
) {
}
