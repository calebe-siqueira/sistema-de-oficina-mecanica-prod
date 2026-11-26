package com.carbulab.dto.cliente;

import java.time.LocalDate;

import com.carbulab.domain.cliente.Cliente;

/**
 * DTO para resposta do perfil do cliente autenticado (dados cadastrais + endereço, sem veículos).
 */
public record ResponseMeuPerfilDTO(
        long cod_cliente,
        String nome_cliente,
        String email,
        String celular,
        String telefone,
        Long fk_cod_endereco,
        String rg,
        String cpf_cnpj,
        LocalDate data_nascimento,
        Character tipo,
        ResponseEnderecoDTO endereco) {

    public ResponseMeuPerfilDTO(Cliente cliente, ResponseEnderecoDTO endereco) {
        this(
                cliente.getCod_cliente(),
                cliente.getNome(),
                cliente.getEmail(),
                cliente.getCelular(),
                cliente.getTelefone(),
                cliente.getFk_cod_endereco(),
                cliente.getRg(),
                cliente.getCpf_cnpj(),
                cliente.getData_nascimento(),
                cliente.getTipo(),
                endereco);
    }
}
