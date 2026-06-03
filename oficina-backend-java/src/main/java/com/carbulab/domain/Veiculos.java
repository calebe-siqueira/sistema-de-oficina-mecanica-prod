package com.carbulab.domain;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Calendar;
import javax.swing.text.MaskFormatter;

public abstract class Veiculos {
    
    private int cod_veiculo;
    private String montadora;
    private String modelo;
    private int ano;
    private String placa;
    private String cor;
    private String combustivel;
    private String ultimaOrdemDeServico; // Variável exclusiva da classe, sendo preenchida em tempo de execução e não sendo armazenada no banco de dados;
    
    private ArrayList<OrdemServico> ordensDeServico = new ArrayList<>();

    // Construtor com codigo do veiculo:
    public Veiculos(int cod_veiculo, String montadora, String modelo, int ano, String placa, String cor, String combustivel) {
        this.cod_veiculo = cod_veiculo;
        this.setMontadora(montadora);
        this.setModelo(modelo);
        this.setAno(ano);
        this.setPlaca(placa);
        this.setCor(cor);
        this.setCombustivel(combustivel);
        atualizarUltimaOrdemDeServico();
    }
    
    // Construtor sem codigo do veículo:
    public Veiculos(String montadora, String modelo, int ano, String placa, String cor, String combustivel) {
        this.setMontadora(montadora);
        this.setModelo(modelo);
        this.setAno(ano);
        this.setPlaca(placa);
        this.setCor(cor);
        this.setCombustivel(combustivel);
        atualizarUltimaOrdemDeServico();
    }

    public int getCod_veiculo() {
        return cod_veiculo;
    }

    public String getMontadora() {
        return montadora;
    }

    public void setMontadora(String montadora) {
        this.montadora = montadora;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public int getAno() {
        return ano;
    }

    public void setAno(int ano) {
        
        // Pegando ano atual do sistema:
        Calendar calendario = Calendar.getInstance();
        int anoAtual = calendario.get(Calendar.YEAR);
        
        if (ano < 0 || ano > anoAtual+1) {
            throw new IllegalArgumentException("Ano inválido para o veículo " + this.getModelo());
        }
        this.ano = ano;
    }

    public String getPlaca() {
        return placa;
    }

    public String getPlacaFormatada() {
        
        if (placa != null) {
            
            String placa = this.placa.replaceAll("[-]", "");
            
            if (placa.matches("[A-z]{3}[ -]?[0-9]{4}")) { // Se placa padrão antigo:
                try {
                    MaskFormatter mascara = new MaskFormatter("AAA-AAAA");

                    mascara.setValueContainsLiteralCharacters(false);
                    return mascara.valueToString(placa).toUpperCase();

                } catch (ParseException ex) {}     
            } else if (placa.matches("[A-z]{3}[0-9]{1}[A-z]{1}[0-9]{2}")) { // Se placa Mercosul:
                return placa.toUpperCase();
            } else {
                return "engraçado";
            }
        } else {
            return null;
        }
        return "uai";
    }

    public void setPlaca(String placa) {
        // Validação de placa: placa padrão antigo || placa padrão Mercosul;
        if (placa != null) {
            if (!placa.matches("[A-z]{3}[ -]?[0-9]{4}") && !placa.matches("[A-z]{3}[0-9]{1}[A-z]{1}[0-9]{2}")) {
                throw new IllegalArgumentException("Placa inválida para veículo " + this.getModelo());
            }
            this.placa = placa;
        } else {
            this.placa = "";
        }
    }

    public String getCor() {
        return cor;
    }

    public void setCor(String cor) {
        this.cor = cor;
    }

    public String getCombustivel() {
        return combustivel;
    }

    public void setCombustivel(String combustivel) {
        this.combustivel = combustivel;
    }

    public String getUltimaOrdemDeServico() {
        return ultimaOrdemDeServico;
    }

    public void atualizarUltimaOrdemDeServico() {
        int indiceUltimaOrdem = ordensDeServico.size()-1;
        this.ultimaOrdemDeServico = indiceUltimaOrdem >= 0?this.getOrdensDeServico().get(indiceUltimaOrdem).getDataFormatada():"Nunca";
    }

    // Métodos:
    public void setOrdensDeServico(ArrayList<OrdemServico> ordensDeServico) {
        this.ordensDeServico = ordensDeServico;
        atualizarUltimaOrdemDeServico();
    }

    public ArrayList<OrdemServico> getOrdensDeServico() {
        return ordensDeServico;
    }
    
    public void adicionarOrdemDeServico(OrdemServico ordemDeServico) {
        this.ordensDeServico.add(ordemDeServico);
        atualizarUltimaOrdemDeServico();
    }
    
    // Métodos:
    public void exibirDados() {
        System.out.println("Veículo: " + this.getMontadora() + " " + this.getModelo() + "(" + this.getPlaca() + ") - " + this.getAno());
    }
    
    public void visualizarHistorico() {
        for (OrdemServico ordemServico : this.getOrdensDeServico()) {
            System.out.println(String.format("%03d", ordemServico.getNumOs()) + " - " + String.format("%02d/%02d/%04d", ordemServico.getData().getDate(), ordemServico.getData().getMonth()+1, ordemServico.getData().getYear()) + " - " + String.format("R$ %.2f", ordemServico.getValor()));
        }
    }
    
}
