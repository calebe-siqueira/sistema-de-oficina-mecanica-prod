package com.carbulab.dto.ordem_servico;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.carbulab.dto.common.PatchField;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para atualização parcial de ordem de serviço.
 */
public record UpdateOsDTO(
    @JsonProperty("data_os")
    PatchField<LocalDate> dataOs,
    PatchField<Integer> quilometragem,
    PatchField<String> descricao,
    @JsonProperty("tipo_desconto")
    PatchField<String> tipoDesconto,
    PatchField<BigDecimal> desconto,
    @JsonProperty("status_servico")
    PatchField<Integer> statusServico,
    @JsonProperty("valor_pago")
    PatchField<BigDecimal> valorPago,
    PatchField<List<@Valid ItemUpdateDTO>> pecas,
    PatchField<List<@Valid ItemUpdateDTO>> servicos
) {
    public UpdateOsDTO {
        dataOs = PatchField.safe(dataOs);
        quilometragem = PatchField.safe(quilometragem);
        descricao = PatchField.safe(descricao);
        tipoDesconto = PatchField.safe(tipoDesconto);
        desconto = PatchField.safe(desconto);
        statusServico = PatchField.safe(statusServico);
        valorPago = PatchField.safe(valorPago);
        pecas = PatchField.safe(pecas);
        servicos = PatchField.safe(servicos);
    }

    public record ItemUpdateDTO(
        @JsonProperty("cod_item")
        Integer codItem,
        @JsonProperty("nome_item")
        String nomeItem,
        @NotNull Integer quantidade,
        @NotNull @JsonProperty("valor_unitario")
        BigDecimal valorUnitario
    ) {}
}
