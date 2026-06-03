package com.carbulab.domain;

public class ItensOrdem {
    
    private String nome;
    private int quantidade;
    private double valor;

    public ItensOrdem(String nome, int quantidade, double valor) {
        this.setNome(nome);
        this.setQuantidade(quantidade);
        this.setValor(valor);
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        if (nome.length() <= 0) {
            throw new IllegalArgumentException("Campo em branco para algum item da O.S.");
        }
        this.nome = nome;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(int quantidade) {
        if (quantidade < 0) {
            throw new IllegalArgumentException("Quantidade inválida para " + this.getNome());
        }
        this.quantidade = quantidade;
    }

    public double getValor() {
        return valor;
    }

    public String getValorFormatado() {
        return String.format("R$ %,.2f", this.valor);
    }

    public void setValor(double valor) {
        if (valor < 0) {
            throw new IllegalArgumentException("Valor inválido para " + this.getNome());
        }
        this.valor = valor;
    }
    
}
