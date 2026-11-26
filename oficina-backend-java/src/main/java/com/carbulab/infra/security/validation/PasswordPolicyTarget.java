package com.carbulab.infra.security.validation;

public interface PasswordPolicyTarget {
    String getSenha();
    String getLogin();
    String getEmail();
    String getNome_usuario();
}
