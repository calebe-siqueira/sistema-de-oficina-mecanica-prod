package com.carbulab.dto.cliente;

import java.time.LocalDate;
import java.util.List;

import com.carbulab.domain.cliente.Cliente;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;

/**
 * DTO para resposta de CLIENTE com suporte a dados relacionados opcionais
 * 
 * - Usada para enviar dados de volta ao cliente (aplicação frontend, por
 * exemplo).
 * - Serve para trafegar apenas as informações necessárias, "blindando" sua API
 * contra a exposição de dados internos da Entidade.
 * - Suporta carregamento condicional de endereços e veículos via query
 * parameters
 * 
 * Exemplos de uso:
 * - GET /api/clientes/{id} → sem dados relacionados
 * - GET /api/clientes/{id}?endereco=true → com endereço
 * - GET /api/clientes/{id}?veiculos=true → com veículos
 * - GET /api/clientes/{id}?all=true → com tudo
 */
public record ResponseClienteDTO(
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
        ResponseEnderecoDTO endereco,
        List<ResponseVeiculoDTO> veiculos) {

    /**
     * Construtor básico (sem dados relacionados)
     */
    public ResponseClienteDTO(Cliente cliente) {
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
                null,
                null);
    }

    /**
     * Construtor com dados relacionados
     */
    public ResponseClienteDTO(
            Cliente cliente,
            ResponseEnderecoDTO endereco,
            List<ResponseVeiculoDTO> veiculos) {
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
                endereco,
                veiculos);
    }
}