package com.carbulab.domain;

import java.util.ArrayList;

// Removemos as importações de banco de dados e JOptionPane
// import conexaobancodedados.ManipulacaoDeDados; (REMOVIDO)
// import javax.swing.JOptionPane; (REMOVIDO)

public class Usuario extends Pessoa {
    
    // Lista estática pode ser mantida para cache simples, mas em Web o ideal é não usar estático para estado
    // public static ArrayList<Usuario> admins = new ArrayList<>(); 
    
    private int codigo;
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

    public int getCodigo() {
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
    
    // --- OBSERVAÇÃO IMPORTANTE ---
    // Todos os métodos abaixo foram REMOVIDOS desta classe:
    // - addCliente, edtCliente, delCliente
    // - addCarro, delCarro
    // - addOs, delOs, addPeca, etc.
    //
    // MOTIVO: Em uma arquitetura Web/Spring, uma instância de 'Usuario' não deve
    // ter a responsabilidade de salvar outros objetos no banco. 
    // Essa responsabilidade agora é dos 'Controllers' e 'Services'.
}