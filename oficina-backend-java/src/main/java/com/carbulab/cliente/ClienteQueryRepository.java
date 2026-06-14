package com.carbulab.cliente;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

/**
 * Repository customizado para CLIENTE com queries complexas
 * 
 * Separado do repositório principal para manter a responsabilidade única:
 * - ClienteRepository: CRUD simples via JPA (gerados automaticamente)
 * - ClienteQueryRepository: Queries customizadas e complexas
 */
@Repository
public interface ClienteQueryRepository extends JpaRepository<Cliente, Long> {
    
    /**
     * Busca clientes por nome (busca parcial)
     */
    @Query(nativeQuery = true, value = 
        "SELECT DISTINCT c.cod_cliente, c.nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, c.email " +
        "FROM tb_cliente c " +
        "WHERE c.nome_cliente LIKE CONCAT('%', :termo, '%')")
    List<Map<String, Object>> buscarPorNome(@Param("termo") String termo);
    
    /**
     * Busca clientes por CPF/CNPJ (remove formatação)
     */
    @Query(nativeQuery = true, value = 
        "SELECT DISTINCT c.cod_cliente, c.nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, c.email " +
        "FROM tb_cliente c " +
        "WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') " +
        "      LIKE CONCAT('%', :termo, '%')")
    List<Map<String, Object>> buscarPorCpfCnpj(@Param("termo") String termo);
    
    /**
     * Busca clientes por telefone ou celular
     */
    @Query(nativeQuery = true, value = 
        "SELECT DISTINCT c.cod_cliente, c.nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, c.email " +
        "FROM tb_cliente c " +
        "WHERE REPLACE(REPLACE(REPLACE(REPLACE(c.celular, '(', ''), ')', ''), '-', ''), ' ', '') " +
        "      LIKE CONCAT('%', :termo, '%') " +
        "   OR REPLACE(REPLACE(REPLACE(REPLACE(c.telefone, '(', ''), ')', ''), '-', ''), ' ', '') " +
        "      LIKE CONCAT('%', :termo, '%')")
    List<Map<String, Object>> buscarPorTelefone(@Param("termo") String termo);
    
    /**
     * Busca clientes por placa de veículo
     */
    @Query(nativeQuery = true, value = 
        "SELECT DISTINCT c.cod_cliente, c.nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, c.email, v.placa as placa_encontrada " +
        "FROM tb_cliente c " +
        "JOIN tb_veiculo v ON c.cod_cliente = v.fk_cod_cliente " +
        "WHERE UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE :placa")
    List<Map<String, Object>> buscarPorPlaca(@Param("placa") String placa);

    /**
     * Busca clientes por CPF/CNPJ (sem formatação). Útil para verificar se já existe
     * no sistema um cliente com o mesmo CPF/CNPJ antes de cadastrar um novo.
     */
    @Query("SELECT c FROM Cliente c WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') = :cpfCnpjClean")
    java.util.Optional<Cliente> findByCpfCnpjClean(@Param("cpfCnpjClean") String cpfCnpjClean);
}
