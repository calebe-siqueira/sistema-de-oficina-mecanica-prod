package com.carbulab.dto.veiculo;

import com.carbulab.dto.common.PatchField;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO para atualização parcial de veículo.
 */
public record UpdateVeiculoDTO(
    @JsonProperty("nome_montadora")
    PatchField<String> nomeMontadora,
    @JsonProperty("nome_modelo")
    PatchField<String> nomeModelo,
    PatchField<Integer> ano,
    PatchField<@Pattern(regexp = "([A-z]{3}[ -]?[0-9]{4})|([A-z]{3}[0-9][A-z][0-9]{2})", message = "Formato inválido para placa do veículo") String> placa,
    PatchField<String> cor,
    PatchField<String> combustivel,
    PatchField<@Size(min = 1, max = 1) String> tipo,
    PatchField<Long> fk_cod_cliente
) {
    public UpdateVeiculoDTO {
        nomeMontadora = PatchField.safe(nomeMontadora);
        nomeModelo = PatchField.safe(nomeModelo);
        ano = PatchField.safe(ano);
        placa = PatchField.safe(placa);
        cor = PatchField.safe(cor);
        combustivel = PatchField.safe(combustivel);
        tipo = PatchField.safe(tipo);
        fk_cod_cliente = PatchField.safe(fk_cod_cliente);
    }
}
