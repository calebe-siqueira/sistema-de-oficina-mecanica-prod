package com.carbulab.cliente.dto;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.format.annotation.DateTimeFormat;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO para atualização de cliente
 * 
 * Todos os campos são opcionais (Optional), permitindo atualizações parciais
 */
public record UpdateClienteDTO(
    Optional<String> nome_cliente,
    Optional<String> email,
    Optional<String> celular,
    Optional<String> telefone,
    Optional<String> rg,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    Optional<LocalDate> data_nascimento,
    Optional<EnderecoDTO> endereco
) {
    
    /**
     * DTO para dados de endereço (atualização)
     */
    public record EnderecoDTO(
        Optional<String> cep,
        Optional<String> logradouro,
        Optional<Integer> numero,
        Optional<String> complemento,
        Optional<String> bairro,
        Optional<String> cidade,
        Optional<String> uf
    ) {}
}
