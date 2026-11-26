package com.carbulab.dto.dashboard;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO para previsão e status da próxima revisão do veículo do cliente.
 */
public record ProximaRevisaoDTO(
        @JsonProperty("cod_veiculo") Integer codVeiculo,
        @JsonProperty("placa") String placa,
        @JsonProperty("modelo") String modelo,
        @JsonProperty("montadora") String montadora,
        @JsonProperty("data_ultima_revisao") LocalDate dataUltimaRevisao,
        @JsonProperty("data_proxima_revisao") LocalDate dataProximaRevisao,
        @JsonProperty("status_revisao") String statusRevisao,
        @JsonProperty("dias_restantes") Long diasRestantes
) {}
