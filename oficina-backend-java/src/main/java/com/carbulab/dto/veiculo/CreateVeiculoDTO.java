package com.carbulab.dto.veiculo;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateVeiculoDTO(
    @NotBlank(message = "A montadora é obrigatória")
    @JsonProperty("nome_montadora")
    String nomeMontadora,
    @NotBlank(message = "O modelo é obrigatório")
    @JsonProperty("nome_modelo")
    String nomeModelo,
    @NotNull(message = "O ano é obrigatório")
    Integer ano,
    @NotBlank(message = "A placa é obrigatória") 
    @Pattern(regexp = "([A-z]{3}[ -]?[0-9]{4})|([A-z]{3}[0-9][A-z][0-9]{2})", message = "Formato inválido para placa do veículo") 
    String placa,
    @NotBlank(message = "A cor é obrigatória")
    String cor,
    @NotBlank(message = "O combustível é obrigatório")
    String combustivel,
    @Size(max = 1, message = "O tipo deve ter no máximo 1 caractere")
    String tipo,
    @NotNull(message = "O ID do cliente (fk_cod_cliente) é obrigatório")
    Long fk_cod_cliente
) {
}
