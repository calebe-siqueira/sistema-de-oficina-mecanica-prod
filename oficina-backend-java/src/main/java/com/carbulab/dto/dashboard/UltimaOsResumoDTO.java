package com.carbulab.dto.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO resumido para listagem das últimas ordens de serviço no dashboard do cliente.
 */
public record UltimaOsResumoDTO(
        @JsonProperty("cod_os") Integer codOs,
        @JsonProperty("data_os") LocalDate dataOs,
        @JsonProperty("status_servico") Integer statusServico,
        @JsonProperty("status_descricao") String statusDescricao,
        @JsonProperty("veiculo") String veiculo,
        @JsonProperty("placa") String placa,
        @JsonProperty("modelo") String modelo,
        @JsonProperty("valor_total") BigDecimal valorTotal
) {}
