package com.carbulab.dto.ordem_servico;

import java.time.LocalDate;

public record SearchOsDTO(
    Long clienteId,
    String tipo,
    String termo,
    LocalDate dataInicio,
    LocalDate dataFim,
    String status
) {
    public SearchOsDTO(String tipo, String termo, LocalDate dataInicio, LocalDate dataFim, String status) {
        this(null, tipo, termo, dataInicio, dataFim, status);
    }
}
