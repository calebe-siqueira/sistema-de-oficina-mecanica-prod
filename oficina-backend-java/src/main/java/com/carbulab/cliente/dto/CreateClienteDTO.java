package com.carbulab.cliente.dto;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO para criação de novo cliente
 * 
 * Recebe dados do frontend e valida antes de criar a entidade Cliente
 */
public record CreateClienteDTO(
    String nome_cliente,
    String email,
    String celular,
    String telefone,
    String rg,
    String cpf_cnpj,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    LocalDate data_nascimento,
    Character tipo,
    EnderecoDTO endereco
) {
    
    /**
     * DTO para dados de endereço
     */
    public record EnderecoDTO(
        String cep,
        String logradouro,
        Integer numero,
        String complemento,
        String bairro,
        String cidade,
        String uf
    ) {}
}
