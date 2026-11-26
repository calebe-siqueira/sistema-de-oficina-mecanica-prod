package com.carbulab.dto.usuario;

import com.carbulab.domain.usuario.UsuarioFuncao;
import com.carbulab.infra.security.validation.PasswordPolicyTarget;
import com.carbulab.infra.security.validation.ValidPasswordPolicy;

/**
 * Record que representa um DTO de registro de usuário
 * @param nome_usuario - Nome do usuário
 * @param email - Email do usuário
 * @param login - Login do usuário
 * @param senha - Senha do usuário
 * @param funcao - Função do usuário
 */
@ValidPasswordPolicy
public record CreateUsuarioDTO(
    String email,
    String nome_usuario,
    String login,
    String senha,
    UsuarioFuncao funcao
) implements PasswordPolicyTarget {
    
    @Override
    public String getSenha() { return senha; }
    @Override
    public String getLogin() { return login; }
    @Override
    public String getEmail() { return email; }
    @Override
    public String getNome_usuario() { return nome_usuario; }
}
