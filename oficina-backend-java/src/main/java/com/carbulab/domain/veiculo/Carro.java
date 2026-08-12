package com.carbulab.domain.veiculo;

import jakarta.persistence.Entity;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLDelete;

@Entity(name = "Carro")
@jakarta.persistence.DiscriminatorValue("C")
@SQLDelete(sql = "UPDATE tb_veiculo SET deleted_at = CURRENT_TIMESTAMP WHERE cod_veiculo = ?")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true) // Gera equals e hashCode apenas com base nos campos da superclasse Veiculos;
public final class Carro extends Veiculo {

    // Construtor com codigo do veiculo:
    public Carro(int cod_veiculo, Modelo modelo, int ano, String placa, String cor, String combustivel) {
        super(cod_veiculo, modelo, ano, placa, cor, combustivel);
    }
    
    // Construtor sem codigo do veiculo:
    public Carro(Modelo modelo, int ano, String placa, String cor, String combustivel) {
        super(modelo, ano, placa, cor, combustivel);
    }
    
    // Construtor com codigo do veiculo (Recebendo objeto CARRO como parâmetro):
    public Carro(Carro carro) {
        super(carro.getCod_veiculo(), carro.getModelo(), carro.getAno(), carro.getPlaca(), carro.getCor(), carro.getCombustivel());
    }
    
}
