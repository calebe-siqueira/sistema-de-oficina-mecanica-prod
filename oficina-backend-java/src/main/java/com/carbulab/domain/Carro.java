package com.carbulab.domain;

public final class Carro extends Veiculos {

    // Construtor com codigo do veiculo:
    public Carro(int cod_veiculo, String montadora, String modelo, int ano, String placa, String cor, String combustivel) {
        super(cod_veiculo, montadora, modelo, ano, placa, cor, combustivel);
    }
    // Construtor sem codigo do veiculo:
    public Carro(String montadora, String modelo, int ano, String placa, String cor, String combustivel) {
        super(montadora, modelo, ano, placa, cor, combustivel);
    }
    
    // Construtor com codigo do veiculo (Recebendo objeto CARRO como parâmetro):
    public Carro(Carro carro) {
        super(carro.getCod_veiculo(), carro.getMontadora(), carro.getModelo(), carro.getAno(), carro.getPlaca(), carro.getCor(), carro.getCombustivel());
    }
    
}
