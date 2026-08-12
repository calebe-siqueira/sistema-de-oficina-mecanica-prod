package com.carbulab.domain.usuario;

/**
 * Enumeração das funções de usuário
 * 
 * - ADMIN: Administrador do sistema
 * - MECANICO: Mecânico do sistema
 * - CLIENTE: Cliente do sistema
 */
public enum UsuarioFuncao {
    ADMIN("admin"),
    MECANICO("mecanico"),
    CLIENTE("cliente");

    private String funcao;

    UsuarioFuncao(String funcao) {
        this.funcao = funcao;
    }

    /**
     * Método getter da função
     * @return String com o nome da função
     */
    public String getFuncao() {
        return funcao;
    }
}
