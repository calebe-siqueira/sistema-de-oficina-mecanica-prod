package com.carbulab.dto.usuario;

import com.carbulab.domain.usuario.UsuarioFuncao;

/**
 * Record que representa um DTO de registro de usuário
 * @param nome_usuario - Nome do usuário
 * @param email - Email do usuário
 * @param login - Login do usuário
 * @param senha - Senha do usuário
 * @param funcao - Função do usuário
 */
public record CreateUsuarioDTO(
    String email,
    String nome_usuario,
    String login,
    String senha,
    UsuarioFuncao funcao
) {
}
