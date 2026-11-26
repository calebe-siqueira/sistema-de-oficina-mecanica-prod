package com.carbulab.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.cliente.Cliente;

import java.util.Optional;

/**
 * Repositório principal para {@link Cliente} — CRUD básico gerado pelo Spring Data JPA.
 *
 * <p>Após a unificação com {@code tb_pessoa}, os campos {@code email} e
 * {@code nome_cliente} residem em {@code tb_pessoa}. As queries abaixo navegam
 * pelo relacionamento {@code c.pessoa.email} (JPQL) ou fazem {@code JOIN}
 * nativo com {@code tb_pessoa} para manter a semântica original.</p>
 *
 * <p>Para queries complexas (busca por nome, CPF, telefone, placa), ver
 * {@link ClienteQueryRepository}.</p>
 */
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Long countByDeletedAtIsNull();

    // -------------------------------------------------------------------------
    // Buscas por e-mail (navegam por c.pessoa.email)
    // -------------------------------------------------------------------------

    @Query("SELECT c FROM Cliente c JOIN c.pessoa p WHERE p.email = :email AND c.deletedAt IS NULL")
    Optional<Cliente> findByEmail(@Param("email") String email);

    @Query("SELECT c FROM Cliente c JOIN c.pessoa p WHERE LOWER(p.email) = LOWER(:email) AND c.deletedAt IS NULL")
    Optional<Cliente> findByEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Cliente c JOIN c.pessoa p WHERE LOWER(p.email) = LOWER(:email) AND c.deletedAt IS NULL")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    // -------------------------------------------------------------------------
    // Busca por CPF/CNPJ
    // -------------------------------------------------------------------------

    @Query("SELECT c FROM Cliente c WHERE REPLACE(REPLACE(REPLACE(c.cpf_cnpj, '.', ''), '-', ''), '/', '') = :cpfCnpjClean AND c.deletedAt IS NULL")
    Optional<Cliente> findByCpfCnpjClean(@Param("cpfCnpjClean") String cpfCnpjClean);

    // -------------------------------------------------------------------------
    // Soft-delete / Lixeira
    // -------------------------------------------------------------------------

    @Transactional
    @Modifying
    @Query(value = "UPDATE tb_cliente SET deleted_at = NULL WHERE cod_cliente = :id", nativeQuery = true)
    void restoreCliente(@Param("id") Long id);

    @Transactional
    @Modifying
    @Query(value = "UPDATE tb_endereco SET deleted_at = NULL WHERE cod_endereco = (SELECT fk_cod_endereco FROM tb_cliente WHERE cod_cliente = :id) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreEnderecoByCliente(@Param("id") Long id, @Param("deletedAt") java.time.LocalDateTime deletedAt);

    @Query(value = "SELECT * FROM tb_cliente WHERE deleted_at IS NOT NULL",
           countQuery = "SELECT count(*) FROM tb_cliente WHERE deleted_at IS NOT NULL",
           nativeQuery = true)
    Page<Cliente> findAllDeleted(Pageable pageable);

    @Transactional
    @Modifying
    @Query(value = "DELETE FROM tb_cliente WHERE cod_cliente = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    int deletarPermanentemente(@Param("id") Long id);
}