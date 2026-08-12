package com.carbulab.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DashboardStatsDTO(
    @JsonProperty("clientesAtivos")
    Long clientesAtivos,
    @JsonProperty("veiculosCadastrados")
    Long veiculosCadastrados,
    @JsonProperty("osEmAndamento")
    Long osEmAndamento,
    @JsonProperty("osConcluidasMes")
    Long osConcluidasMes
) {
}
