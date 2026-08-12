package com.carbulab.domain;

import jakarta.persistence.MappedSuperclass;

import java.time.LocalDateTime;

import com.carbulab.exception.BusinessValidationException;

import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@MappedSuperclass // Define que esta é uma classe pai cujos atributos e regras de mapeamento são herdados por outras classes filhas
@Getter
@Setter
@NoArgsConstructor
public abstract class Pessoa {
    public Pessoa(String nome, String email) {
        this.nome = nome;
        this.email = email;
    }
    
    public Pessoa(String nome, String email, LocalDateTime deletedAt) {
        this.nome = nome;
        this.email = email;
        this.deletedAt = deletedAt;
    }

    @Column(name = "nome")
    private String nome;
    @Column(name = "email")
    private String email;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void setEmail(String email) { // Não obrigatório
        if (email != null) {
            if (!email.equals("")) {
                if ((email.length() < 11) || !(email.contains("@") && (email.contains(".")))) {
                    throw new BusinessValidationException("Email inválido");
                }
            }
        }
        this.email = email;
    }
}
