package com.carbulab.veiculo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.carbulab.domain.dto.VeiculoResponseDTO;

@Table(name = "tb_veiculo")
@Entity(name = "Veiculo")
@Getter
@Setter
@EqualsAndHashCode(of = "cod_veiculo", callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class Veiculo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long cod_veiculo;
    
    private String montadora;
    private String modelo;
    private int ano;
    private String placa;
    private String cor;
    private String combustivel;
    
    @Column(name = "tipo")
    private String tipo;
    
    @Column(name = "fk_cod_cliente")
    private long fk_cod_cliente;
    
    /**
     * Converter entidade para DTO
     */
    public VeiculoResponseDTO toDTO() {
        return new VeiculoResponseDTO(
            cod_veiculo,
            montadora,
            modelo,
            ano,
            placa,
            cor,
            combustivel,
            tipo,
            fk_cod_cliente
        );
    }
}
