package com.carbulab.cliente;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import com.carbulab.cliente.dto.*;
import com.carbulab.domain.Cep;
import com.carbulab.domain.Endereco;
import com.carbulab.domain.dto.EnderecoResponseDTO;
import com.carbulab.domain.dto.VeiculoResponseDTO;
import com.carbulab.utils.ConsultaPorPlaca;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.exception.DuplicateResourceException;

import java.util.*;

/**
 * Service para CLIENTE
 * 
 * Centraliza toda a lógica de negócio relacionada a clientes:
 * - Validações
 * - Transformações de dados
 * - Coordenação de operações
 * - Garantias transacionais
 */

@Service
public class ClienteService {
    
    @Autowired
    private ClienteRepository repository;
    
    @Autowired
    private ClienteQueryRepository queryRepository;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // ===================== LISTAR =======================
    
    /**
     * Buscar todos os clientes
     */
    public List<ClienteResponseDTO> listarTodos() {
        return repository.findAll()
            .stream()
            .map(ClienteResponseDTO::new)
            .toList();
    }
    
    // ===================== BUSCAR =======================
    
    /**
     * Buscar cliente por ID (básico)
     */
    public ClienteResponseDTO buscarPorId(Long id) {
        return repository.findById(id)
            .map(ClienteResponseDTO::new)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
    }
    
    /**
     * Buscar cliente com dados relacionados (endereço e/ou veículos)
     * 
     * @param id Cliente ID
     * @param includeEndereco Se true, carrega endereço
     * @param includeVeiculos Se true, carrega veículos
     * @return ClienteResponseDTO com dados opcionais
     */
    public ClienteResponseDTO buscarPorIdCompleto(Long id, boolean includeEndereco, boolean includeVeiculos) {
        Cliente cliente = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        EnderecoResponseDTO endereco = null;
        List<VeiculoResponseDTO> veiculos = null;
        if (includeEndereco && cliente.getFk_cod_endereco() != null) {
            endereco = carregarEnderecoDTO(cliente.getFk_cod_endereco());
        }
        
        if (includeVeiculos) {
            veiculos = carregarVeiculosDTO(id);
        }
        
        return new ClienteResponseDTO(cliente, endereco, veiculos);
    }
    
    /**
     * Busca com filtros dinâmicos
     * Tipos suportados: "nome", "cpf_cnpj", "telefone", "placa"
     */
    public List<Map<String, Object>> buscar(SearchClienteDTO search) {
        if (search.termo() == null || search.termo().isBlank()) {
            return List.of();
        }
        
        String termo = search.termo().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        
        return switch(search.tipo()) {
            // Utiliza o repositório de queries customizadas para buscas complexas (uma vez que as buscas por nome, CPF/CNPJ, telefone e placa exigem manipulações específicas, que não são geradas automaticamente pelo Spring Data JPA)
            case "nome" -> queryRepository.buscarPorNome(search.termo());
            case "cpf_cnpj" -> queryRepository.buscarPorCpfCnpj(termo);
            case "telefone" -> queryRepository.buscarPorTelefone(termo);
            case "placa" -> {
                String placaFormatada = adaptarPlacaMercosul(termo);
                List<Map<String, Object>> resultado = queryRepository.buscarPorPlaca("%" + termo + "%");
                if (resultado.isEmpty() && (placaFormatada != null ? !placaFormatada.equals(termo) : false)) {
                    resultado = queryRepository.buscarPorPlaca("%" + placaFormatada + "%");
                }
                yield resultado;
            }
            default -> throw new IllegalArgumentException("Tipo de busca inválido: " + search.tipo());
        };
    }
    
    // ===================== CRIAR =======================
    
    /**
     * Criar novo cliente com validações
     */
    @Transactional
    public ClienteResponseDTO criar(CreateClienteDTO dto) {
        validarDadosCliente(dto);
        
        if (dto.cpf_cnpj() != null && !dto.cpf_cnpj().isBlank()) {
            String cpfCnpjClean = dto.cpf_cnpj().replaceAll("[^0-9]", "");

            Optional<Cliente> clienteCpfCnpjJaCadastrado = queryRepository.findByCpfCnpjClean(cpfCnpjClean);
            if (clienteCpfCnpjJaCadastrado.isPresent()) {
                throw new DuplicateResourceException(String.format("Já existe um cliente cadastrado com este CPF/CNPJ (Nome: %s).", clienteCpfCnpjJaCadastrado.get().getNome()));
            }
        }

        // 1. Criar entidade Cliente
        Cliente novoCliente = new Cliente();
        novoCliente.setNome(dto.nome_cliente());
        novoCliente.setEmail(dto.email());
        novoCliente.setCelular(dto.celular());
        novoCliente.setTelefone(dto.telefone());
        novoCliente.setRg(dto.rg());
        novoCliente.setCpf_cnpj(dto.cpf_cnpj());
        novoCliente.setNascimento(dto.data_nascimento());
        novoCliente.setTipo(dto.tipo());

        // 2. Mapear endereço do DTO (se ele existir)
        if (dto.endereco() != null) {

            // Dados do CEP
            Cep dadosCep = new Cep();
            // Campos da tb_cep
            dadosCep.setCep(dto.endereco().cep());
            dadosCep.setUf(dto.endereco().uf());
            dadosCep.setCidade(dto.endereco().cidade());
            dadosCep.setBairro(dto.endereco().bairro());
            dadosCep.setLogradouro(dto.endereco().logradouro());
            
            // Endereço completo
            Endereco endereco = new Endereco();
            // Campos da tb_endereco
            endereco.setNumero(dto.endereco().numero());
            endereco.setComplemento(dto.endereco().complemento());
            endereco.setCep(dadosCep);

            // Vincula o endereço completo ao cliente
            novoCliente.setEndereco(endereco);
        }

        // Salvar e retornar como DTO
        Cliente salvo = repository.save(novoCliente);
        return new ClienteResponseDTO(salvo);
    }
    
    // ===================== ATUALIZAR =======================
    
    /**
     * Atualizar cliente existente
     */
    @Transactional
    public ClienteResponseDTO atualizar(Long id, UpdateClienteDTO dto) {
        Cliente cliente = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
        
        // 1- Atualizar os campos básicos do cliente (apenas os fornecidos (Optional))
        dto.nome_cliente().ifPresent(cliente::setNome);
        dto.email().ifPresent(cliente::setEmail);
        dto.celular().ifPresent(cliente::setCelular);
        dto.telefone().ifPresent(cliente::setTelefone);
        dto.rg().ifPresent(cliente::setRg);
        dto.data_nascimento().ifPresent(cliente::setNascimento);

        // 2- Atualizar o bloco de endereço, se ele estiver presente na requisição
        dto.endereco().ifPresent(enderecoDto -> {

            // Verifica se todos os campos do endereço estão vazios/nulos
            // Nesse caso, o usuário quer remover o endereço do cliente
            boolean todosOsCamposVazios =
                enderecoDto.cep().map(String::isBlank).orElse(true) &&
                enderecoDto.logradouro().map(String::isBlank).orElse(true) &&
                enderecoDto.bairro().map(String::isBlank).orElse(true) &&
                enderecoDto.cidade().map(String::isBlank).orElse(true) &&
                enderecoDto.uf().map(String::isBlank).orElse(true) &&
                enderecoDto.complemento().map(String::isBlank).orElse(true) &&
                enderecoDto.numero().isEmpty();

            if (todosOsCamposVazios) {
                // Remove a referência ao endereço no cliente
                // O CascadeType.ALL garante que o registro em tb_endereco (e tb_cep via cascade) também será excluído
                cliente.setEndereco(null);
                return;
            }

            Endereco enderecoAtual = cliente.getEndereco();
            
            // Se o cliente não possuía endereço, cria um novo
            if (enderecoAtual == null) {
                enderecoAtual = new Endereco();
                cliente.setEndereco(enderecoAtual);
            }
            
            // Atualiza os campos da tabela tb_endereco
            enderecoDto.numero().ifPresent(enderecoAtual::setNumero);
            enderecoDto.complemento().ifPresent(enderecoAtual::setComplemento);
            
            // Verifica e inicializa a entidade Cep, se necessário
            Cep cepAtual = enderecoAtual.getCep();
            if (cepAtual == null) {
                cepAtual = new Cep();
                enderecoAtual.setCep(cepAtual);
            }
            
            // Atualiza os campos da tabela tb_cep
            cepAtual.setCep(enderecoDto.cep().orElse(null));
            enderecoDto.logradouro().ifPresent(cepAtual::setLogradouro);
            enderecoDto.bairro().ifPresent(cepAtual::setBairro);
            enderecoDto.cidade().ifPresent(cepAtual::setCidade);
            enderecoDto.uf().ifPresent(cepAtual::setUf);
        });

        // Salvar e retornar como DTO
        Cliente atualizado = repository.save(cliente);
        return new ClienteResponseDTO(atualizado);
    }
    
    // ===================== DELETAR =======================
    
    /**
     * Deletar cliente por ID
     */
    @Transactional
    public void deletar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Cliente não encontrado com ID: " + id);
        }
        repository.deleteById(id);
    }
    
    // ===================== MÉTODOS PRIVADOS =======================
    
    /**
     * Carregar endereço do banco
     */
    private EnderecoResponseDTO carregarEnderecoDTO(Long codEndereco) {
        try {
            // Tenta carregar com todas as colunas possíveis
            String sql = "SELECT e.*, c.* FROM tb_endereco AS e INNER JOIN tb_cep AS c ON e.fk_cod_cep = c.cod_cep WHERE cod_endereco = ?";
            var map = jdbcTemplate.queryForMap(sql, codEndereco);
            
            Integer numero = map.get("numero") != null ? Integer.valueOf(map.get("numero").toString()) : null;
            
            return new EnderecoResponseDTO(
                ((Number) map.get("cod_endereco")).longValue(),
                (long) ((Number) map.get("fk_cod_cep")).longValue(),
                (Integer) numero,
                (String) map.get("complemento"),
                (String) map.get("cep"),
                (String) map.get("uf"),
                (String) map.get("bairro"),
                (String) map.get("cidade"),
                (String) map.get("logradouro")
            );
        } catch (Exception e) { // Erro ao carregar endereço
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Carregar veículos do cliente
     */
    private List<VeiculoResponseDTO> carregarVeiculosDTO(Long clienteId) {
        try {
            String sql = "SELECT cod_veiculo, montadora, modelo, ano, placa, cor, combustivel, tipo, fk_cod_cliente " +
                         "FROM tb_veiculo WHERE fk_cod_cliente = ? ORDER BY cod_veiculo DESC";
            
            return jdbcTemplate.query(sql, (rs, rowNum) -> 
                new VeiculoResponseDTO(
                    rs.getLong("cod_veiculo"),
                    rs.getString("montadora"),
                    rs.getString("modelo"),
                    rs.getInt("ano"),
                    rs.getString("placa"),
                    rs.getString("cor"),
                    rs.getString("combustivel"),
                    rs.getString("tipo"),
                    rs.getLong("fk_cod_cliente")
                ), clienteId);
        } catch (Exception e) {
            return List.of();
        }
    }
    
    /**
     * Validar dados do cliente
     */
    private void validarDadosCliente(CreateClienteDTO dto) {
        if (dto.nome_cliente() == null || dto.nome_cliente().isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório");
        }
        
        // if (dto.cpf_cnpj() == null || dto.cpf_cnpj().isBlank()) {
        //     throw new IllegalArgumentException("CPF/CNPJ é obrigatório");
        // }
        
        // if (dto.tipo() == 'F' && (dto.nascimento() == null)) {
        //     throw new IllegalArgumentException("Data de nascimento é obrigatória para pessoa física");
        // }
    }
    
    /**
     * Adaptar placa para formato Mercosul (novo padrão brasileiro)
     * 
     * Exemplos:
     * Caso seja passado no formato antigo: "ABC1234" -> "ABC1C34"
     * OU
     * Caso seja passado no formato Mercosul: "ABC1A34" -> "ABC1034"
     * 
     * Retorna a placa adaptada ou, se não for possível adaptar (ex: formato inválido), retorna a original
     * Essa adaptação é necessária porque os clientes podem ter placas cadastradas em ambos os formatos, e queremos garantir que a busca funcione independentemente do formato fornecido pelo usuário.
     * A lógica de adaptação é baseada nas regras de formação das placas Mercosul, onde a letra do meio (4ª posição) é substituída por um número específico, e vice-versa.
     * 
     */
    private String adaptarPlacaMercosul(String placa) {
        try {
            return ConsultaPorPlaca.adaptaPlacaParaFormatoMercosul(placa);
        } catch (Exception e) {
            return placa; // Retorna placa original se falhar
        }
    }
}
