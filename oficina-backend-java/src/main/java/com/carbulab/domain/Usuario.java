package com.carbulab.domain;

import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Table(name = "tb_usuario")
@Entity(name = "Usuario")
public class Usuario extends Pessoa {
    
    @Id
    private long codigo;
    private String login;
    private String senha; // Em produção, isso armazena o Hash BCrypt
    private String funcao;

    // Construtor completo
    public Usuario(int codigo, String nome, String email, String login, String senha, String funcao) {
        super(nome, email);
        this.setCodigo(codigo);
        this.setLogin(login);
        this.setSenha(senha);
        this.setFuncao(funcao);
    }
    
    // Construtor sem ID (para novos cadastros)
    public Usuario(String nome, String email, String login, String senha, String funcao) {
        super(nome, email);
        this.setLogin(login);
        this.setSenha(senha);
        this.setFuncao(funcao);
    }

    // --- Getters e Setters ---
    public long getCodigo() {
        return codigo;
    }

    public void setCodigo(int codigo) {
        this.codigo = codigo;
    }
    
    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getFuncao() {
        return funcao;
    }

    public void setFuncao(String funcao) {
        this.funcao = funcao;
    }

}