package com.carbulab.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

import org.springframework.data.jpa.repository.Query;

import com.carbulab.domain.cliente.Cliente;

/**
 * Interface repositório para CLIENTE - CRUD Básico
 * 
 * Responsabilidades:
 * - Operações CRUD simples (Save, FindById, Delete, etc)
 * - Geradas automaticamente pelo Spring Data JPA
 * 
 * Para queries customizadas, ver ClienteQueryRepository
 */

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
	
	Long countByDeletedAtIsNull();

	@Query("SELECT c FROM Cliente c WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') = :cpfCnpjClean")
	java.util.Optional<Cliente> findByCpfCnpjClean(@Param("cpfCnpjClean") String cpfCnpjClean);

	// Soft Restore queries
	@Modifying
	@Query(value = "UPDATE tb_cliente SET deleted_at = NULL WHERE cod_cliente = :id", nativeQuery = true)
	void restoreCliente(@Param("id") Long id);

	@Modifying
	@Query(value = "UPDATE tb_endereco SET deleted_at = NULL WHERE cod_endereco = (SELECT fk_cod_endereco FROM tb_cliente WHERE cod_cliente = :id) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
	void restoreEnderecoByCliente(@Param("id") Long id, @Param("deletedAt") java.time.LocalDateTime deletedAt);

	@Query(value = "SELECT * FROM tb_cliente WHERE deleted_at IS NOT NULL", nativeQuery = true)
	java.util.List<Cliente> findAllDeleted();

	@Modifying
	@Query(value = "DELETE FROM tb_cliente WHERE cod_cliente = :id AND deleted_at IS NOT NULL", nativeQuery = true)
	int deletarPermanentemente(@Param("id") Long id);
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