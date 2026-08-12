package com.carbulab.dto.ordem_servico;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateOsDTO(
    @NotNull @JsonProperty("data_os")
	LocalDate dataOs,
    Integer quilometragem,
    String descricao,
    @JsonProperty("tipo_desconto")
	String tipoDesconto,
    BigDecimal desconto,
    @JsonProperty("status_servico")
	Integer statusServico,
    @JsonProperty("valor_pago")
	BigDecimal valorPago,
    @NotNull Integer fk_cod_veiculo,
    List<ItemDTO> pecas,
    List<ItemDTO> servicos
) {
    public record ItemDTO(
        @JsonProperty("cod_item")
        Integer codItem,
        @JsonProperty("nome_item")
		String nomeItem,
        @NotNull Integer quantidade,
        @NotNull @JsonProperty("valor_unitario")
		BigDecimal valorUnitario
    ) {}
}
