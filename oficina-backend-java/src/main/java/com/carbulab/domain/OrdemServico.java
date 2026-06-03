package com.carbulab.domain;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;

public class OrdemServico {
    
    private int numOs;
    private Date data;
    private int quilometragem;
    private String descricao;
    private double valor;
    
    private ArrayList<Pecas> pecas = new ArrayList<>();
    private ArrayList<Servicos> servicos = new ArrayList<>();
    
    // Construtor com codigo da ordem:
    public OrdemServico(int codigo, Date data, int quilometragem, String descricao) {
        this.numOs = codigo;
        this.setData(data);
        this.setQuilometragem(quilometragem);
        this.setDescricao(descricao);
    }
    
    // Construtor sem codigo da ordem:
    public OrdemServico(Date data, int quilometragem, String descricao) {
        this.setData(data);
        this.setQuilometragem(quilometragem);
        this.setDescricao(descricao);
    }

    public int getNumOs() {
        return numOs;
    }

    public Date getData() {
        return data;
    }

    public String getDataFormatada() {
        SimpleDateFormat formatoData = new SimpleDateFormat("dd/MM/yyyy");
        
        return formatoData.format(this.data);
    }

    public void setData(Date data) {
        this.data = data;
    }

    public int getQuilometragem() {
        return quilometragem;
    }

    public void setQuilometragem(int quilometragem) {
        this.quilometragem = quilometragem;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public double getValor() {
        return valor;
    }

    public String getValorFormatado() {
        return String.format("R$ %,.2f", this.valor);
    }

    public ArrayList<Pecas> getPecas() {
        return pecas;
    }
    
    public void setPecas(ArrayList<Pecas> pecas) {
        this.pecas = pecas;
    }

    public ArrayList<Servicos> getServicos() {
        return servicos;
    }
    
    public void setServicos(ArrayList<Servicos> servicos) {
        this.servicos = servicos;
    }

    // Métodos:
    public void adicionarPeca(Pecas peca) {
        this.pecas.add(peca);
        
        calcularValor();
    }
    
    public void adicionarServico(Servicos servico) {
        this.servicos.add(servico);
        
        calcularValor();
    }
    
    public void calcularValor() {
        double valPecas = 0;
        for (Pecas peca : pecas) {
            valPecas += peca.getQuantidade()*peca.getValor();
        }
        
        double valServicos = 0;
        for (Servicos servico : servicos) {
            valServicos += servico.getQuantidade()*servico.getValor();
        }
        
        double valor = valPecas + valServicos;
        
        this.valor = valor;
    }
    
    public void exibirOrdem() {
        
        System.out.printf("\nDescrição: %s\n", this.getDescricao());
        int x=0;
        for (Servicos servico : this.getServicos()) {
            System.out.printf("%dº serviço: %s - %d un - R$ %.2f\n", ++x, servico.getNome(), servico.getQuantidade(), servico.getValor());
        }
        x=0;
        for (Pecas peca : this.getPecas()) {
            System.out.printf("%dª peça: %s - %d un - R$ %.2f\n", ++x, peca.getNome(), peca.getQuantidade(), peca.getValor());
        }
        System.out.printf("Valor total O.S.: R$ %.2f\n\n", this.getValor());
        
    }
    
}
