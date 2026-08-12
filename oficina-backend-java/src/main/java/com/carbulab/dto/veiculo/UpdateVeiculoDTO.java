package com.carbulab.dto.veiculo;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateVeiculoDTO(
    @JsonProperty("nome_montadora")
    String nomeMontadora,
    @JsonProperty("nome_modelo")
    String nomeModelo,
    Integer ano,
    @Pattern(regexp = "([A-z]{3}[ -]?[0-9]{4})|([A-z]{3}[0-9][A-z][0-9]{2})", message = "Formato inválido para placa do veículo") 
    String placa,
    String cor,
    String combustivel,
    @Size(min = 1, max = 1) String tipo,
    Long fk_cod_cliente
) {
}
