package com.carbulab.domain.dto;

/**
 * DTO para resposta de Veículos (Data Transfer Object)
 * 
 * - Usada para enviar dados de veículos ao cliente
 * - Trafega apenas informações necessárias
 */
public record VeiculoResponseDTO(
    long cod_veiculo,
    String montadora,
    String modelo,
    int ano,
    String placa,
    String cor,
    String combustivel,
    String tipo,
    long fk_cod_cliente
) {
}
