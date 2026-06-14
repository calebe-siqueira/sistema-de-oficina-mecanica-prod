package com.carbulab.domain;

import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@Getter
@Setter
public abstract class Pessoa {

    @Column(name = "nome_cliente")
    private String nome;
    @Column(name = "email")
    private String email;

    public Pessoa(String nome, String email) {
        this.setNome(nome);
        this.setEmail(email);
    }

    public void setEmail(String email) { // Não obrigatório
        if (email != null) {
            if (!email.equals("")) {
                if ((email.length() < 11) || !(email.contains("@") && (email.contains(".")))) {
                    throw new IllegalArgumentException("Email inválido para " + this.getNome());
                }
            }
        }
        this.email = email;
    }
}