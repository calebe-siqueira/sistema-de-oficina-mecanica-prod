package com.carbulab.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.carbulab.domain.cliente.Cliente;

import java.util.Map;
import java.util.Optional;

/**
 * Repository customizado para CLIENTE com queries complexas.
 *
 * <p>Separado do repositório principal para manter responsabilidade única:</p>
 * <ul>
 *   <li>{@link ClienteRepository}: CRUD simples via JPA</li>
 *   <li>{@link ClienteQueryRepository}: Queries customizadas e complexas</li>
 * </ul>
 *
 * <p>Após a unificação com {@code tb_pessoa}, as queries nativas que antes
 * selecionavam {@code c.email} e {@code c.nome_cliente} agora fazem
 * {@code JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa} e leem
 * {@code p.email} e {@code p.nome}.</p>
 */
public interface ClienteQueryRepository extends JpaRepository<Cliente, Long> {

    /**
     * Busca clientes por código (ID).
     */
    @Query(nativeQuery = true, value =
        "SELECT DISTINCT c.cod_cliente, p.nome AS nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, p.email " +
        "FROM tb_cliente c " +
        "JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
        "WHERE c.cod_cliente = :termo AND c.deleted_at IS NULL",
        countQuery = "SELECT COUNT(DISTINCT c.cod_cliente) FROM tb_cliente c WHERE c.cod_cliente = :termo AND c.deleted_at IS NULL")
    Page<Map<String, Object>> buscarPorId(@Param("termo") Long termo, Pageable pageable);

    /**
     * Busca clientes por nome (busca parcial).
     */
    @Query(nativeQuery = true, value =
        "SELECT DISTINCT c.cod_cliente, p.nome AS nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, p.email " +
        "FROM tb_cliente c " +
        "JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
        "WHERE p.nome LIKE CONCAT('%', :termo, '%') AND c.deleted_at IS NULL",
        countQuery = "SELECT COUNT(DISTINCT c.cod_cliente) FROM tb_cliente c JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa WHERE p.nome LIKE CONCAT('%', :termo, '%') AND c.deleted_at IS NULL")
    Page<Map<String, Object>> buscarPorNome(@Param("termo") String termo, Pageable pageable);

    /**
     * Busca clientes por CPF/CNPJ (remove formatação).
     */
    @Query(nativeQuery = true, value =
        "SELECT DISTINCT c.cod_cliente, p.nome AS nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, p.email " +
        "FROM tb_cliente c " +
        "JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
        "WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') " +
        "      LIKE CONCAT('%', :termo, '%') AND c.deleted_at IS NULL",
        countQuery = "SELECT COUNT(DISTINCT c.cod_cliente) FROM tb_cliente c WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') LIKE CONCAT('%', :termo, '%') AND c.deleted_at IS NULL")
    Page<Map<String, Object>> buscarPorCpfCnpj(@Param("termo") String termo, Pageable pageable);

    /**
     * Busca clientes por telefone ou celular.
     */
    @Query(nativeQuery = true, value =
        "SELECT DISTINCT c.cod_cliente, p.nome AS nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, p.email " +
        "FROM tb_cliente c " +
        "JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
        "WHERE (REPLACE(REPLACE(REPLACE(REPLACE(c.celular, '(', ''), ')', ''), '-', ''), ' ', '') " +
        "      LIKE CONCAT('%', :termo, '%') " +
        "   OR REPLACE(REPLACE(REPLACE(REPLACE(c.telefone, '(', ''), ')', ''), '-', ''), ' ', '') " +
        "      LIKE CONCAT('%', :termo, '%')) AND c.deleted_at IS NULL",
        countQuery = "SELECT COUNT(DISTINCT c.cod_cliente) FROM tb_cliente c WHERE (REPLACE(REPLACE(REPLACE(REPLACE(c.celular, '(', ''), ')', ''), '-', ''), ' ', '') LIKE CONCAT('%', :termo, '%') OR REPLACE(REPLACE(REPLACE(REPLACE(c.telefone, '(', ''), ')', ''), '-', ''), ' ', '') LIKE CONCAT('%', :termo, '%')) AND c.deleted_at IS NULL")
    Page<Map<String, Object>> buscarPorTelefone(@Param("termo") String termo, Pageable pageable);

    /**
     * Busca clientes por placa de veículo (placa exata normalizada).
     */
    @Query(nativeQuery = true, value =
        "SELECT DISTINCT c.cod_cliente, p.nome AS nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, p.email, v.placa as placa_encontrada " +
        "FROM tb_cliente c " +
        "JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
        "JOIN tb_veiculo v ON c.cod_cliente = v.fk_cod_cliente " +
        "WHERE UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE :placa AND c.deleted_at IS NULL AND v.deleted_at IS NULL",
        countQuery = "SELECT COUNT(DISTINCT c.cod_cliente) FROM tb_cliente c JOIN tb_veiculo v ON c.cod_cliente = v.fk_cod_cliente WHERE UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE :placa AND c.deleted_at IS NULL AND v.deleted_at IS NULL")
    Page<Map<String, Object>> buscarPorPlaca(@Param("placa") String placa, Pageable pageable);

    /**
     * Busca clientes por placa de veículo (suporta variantes parciais).
     */
    @Query(nativeQuery = true, value =
        "SELECT DISTINCT c.cod_cliente, p.nome AS nome_cliente, c.cpf_cnpj, " +
        "       c.celular, c.telefone, p.email, v.placa as placa_encontrada " +
        "FROM tb_cliente c " +
        "JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
        "JOIN tb_veiculo v ON c.cod_cliente = v.fk_cod_cliente " +
        "WHERE (UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE CONCAT('%', :termo1, '%') " +
        "   OR UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE CONCAT('%', :termo2, '%')) " +
        "  AND c.deleted_at IS NULL AND v.deleted_at IS NULL",
        countQuery = "SELECT COUNT(DISTINCT c.cod_cliente) FROM tb_cliente c JOIN tb_veiculo v ON c.cod_cliente = v.fk_cod_cliente WHERE (UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE CONCAT('%', :termo1, '%') OR UPPER(REPLACE(REPLACE(v.placa, '-', ''), ' ', '')) LIKE CONCAT('%', :termo2, '%')) AND c.deleted_at IS NULL AND v.deleted_at IS NULL")
    Page<Map<String, Object>> buscarPorPlacaVariantes(@Param("termo1") String termo1, @Param("termo2") String termo2, Pageable pageable);

    /**
     * Busca um cliente por CPF/CNPJ sem formatação.
     * Útil para verificar duplicidade antes de cadastrar.
     */
    @Query("SELECT c FROM Cliente c WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') = :cpfCnpjClean AND c.deletedAt IS NULL")
    Optional<Cliente> findByCpfCnpjClean(@Param("cpfCnpjClean") String cpfCnpjClean);
}
