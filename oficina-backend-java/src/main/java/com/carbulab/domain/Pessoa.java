package com.carbulab.domain;

public abstract class Pessoa {

    private String nome;
    private String email;

    public Pessoa(String nome, String email) {
        this.setNome(nome);
        this.setEmail(email);
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) { // Nomes podem ter parênteses, por exemplo (no backup trazido da oficina tem)
        this.nome = nome;
    }

    public String getEmail() {
        return email;
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