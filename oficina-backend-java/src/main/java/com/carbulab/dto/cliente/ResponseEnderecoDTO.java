package com.carbulab.dto.cliente;

/**
 * DTO para resposta de Endereços (Data Transfer Object)
 * 
 * - Usada para enviar dados de endereços ao cliente
 * - Trafega apenas informações necessárias
 */
public record ResponseEnderecoDTO(
    // Tabela tb_endereco no banco de dados:
    long cod_endereco,
    long fk_cep,
    Integer numero,
    String complemento,

    // Tabela tb_cep no banco de dados:
    // long cod_cep, // cod_cep omitido
    String cep,
    String uf,
    String cidade,
    String bairro,
    String logradouro
) {
}
