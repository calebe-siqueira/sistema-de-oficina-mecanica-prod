package com.carbulab.dto.dashboard;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO consolidado do dashboard para o cliente autenticado (ROLE_USER).
 */
public record DashboardClienteDTO(
        @JsonProperty("total_veiculos") Long totalVeiculos,
        @JsonProperty("total_ordens_servico") Long totalOrdensServico,
        @JsonProperty("proximas_revisoes") List<ProximaRevisaoDTO> proximasRevisoes,
        @JsonProperty("ultimas_ordens_servico") List<UltimaOsResumoDTO> ultimasOrdensServico
) {}
