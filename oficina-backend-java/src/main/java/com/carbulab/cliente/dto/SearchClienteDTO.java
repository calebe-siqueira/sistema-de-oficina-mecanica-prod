package com.carbulab.cliente.dto;

/**
 * DTO para busca/filtro de clientes
 * 
 * Encapsula os parâmetros de busca de forma type-safe
 */
public record SearchClienteDTO(
    String termo,
    String tipo  // "nome", "cpf_cnpj", "telefone", "placa"
) {}
