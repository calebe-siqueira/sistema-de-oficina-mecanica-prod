package com.carbulab.cliente;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Interface repositório para CLIENTE - CRUD Básico
 * 
 * Responsabilidades:
 * - Operações CRUD simples (Save, FindById, Delete, etc)
 * - Geradas automaticamente pelo Spring Data JPA
 * 
 * Para queries customizadas, ver ClienteQueryRepository
 */

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    
}


/**
 * Exemplos de operações que podem ser feitas com este repositório:
 * 
 * save(Cliente cliente) - Salvar ou atualizar um cliente
 * saveAll(List<Cliente> clientes) - Salvar ou atualizar uma lista de clientes
 * findById(Long id) - Buscar cliente por ID
 * existsById(Long id) - Verificar se cliente existe por ID
 * findAll() - Buscar todos os clientes (retorna todas as entidades da tabela)
 * deleteById(Long id) - Excluir cliente por ID
 * delete(Cliente cliente) - Excluir um cliente
 * 
 * findByNome(String nome) - Buscar clientes por nome (se definido na entidade)
 * findByEmail(String email) - Buscar clientes por email (se definido na entidade)
 * findByCelular(String celular) - Buscar clientes por celular (se definido na entidade)
 * findByTelefone(String telefone) - Buscar clientes por telefone (se definido na entidade)
 * findByRg(String rg) - Buscar clientes por RG (se definido na entidade)
 * 
 * [...]
 * 
 */