package com.carbulab.dto.usuario;

import com.carbulab.domain.usuario.UsuarioFuncao;
import com.carbulab.dto.common.PatchField;
import com.carbulab.infra.security.validation.PasswordPolicyTarget;
import com.carbulab.infra.security.validation.ValidPasswordPolicy;

import jakarta.validation.constraints.NotNull;

/**
 * Record que representa um DTO de atualização parcial de usuário.
 */
@ValidPasswordPolicy(allowEmpty = true)
public record UpdateUsuarioDTO(
    @NotNull Long cod_usuario,
    PatchField<String> nome_usuario,
    PatchField<String> login,
    PatchField<String> senha,
    PatchField<String> email,
    PatchField<UsuarioFuncao> funcao
) implements PasswordPolicyTarget {

    public UpdateUsuarioDTO {
        nome_usuario = PatchField.safe(nome_usuario);
        login = PatchField.safe(login);
        senha = PatchField.safe(senha);
        email = PatchField.safe(email);
        funcao = PatchField.safe(funcao);
    }

    @Override
    public String getSenha() { return senha.valueOr(null); }

    @Override
    public String getLogin() { return login.valueOr(null); }

    @Override
    public String getEmail() { return email.valueOr(null); }

    @Override
    public String getNome_usuario() { return nome_usuario.valueOr(null); }
}
