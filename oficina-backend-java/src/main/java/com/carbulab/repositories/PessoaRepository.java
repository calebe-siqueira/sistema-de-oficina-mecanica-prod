package com.carbulab.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.carbulab.domain.Pessoa;

/**
 * Repositório para a entidade {@link Pessoa}.
 *
 * <p>Centraliza todas as buscas pela identidade única (nome + email)
 * que é compartilhada entre {@code Cliente} e {@code Usuario}.</p>
 */
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    /**
     * Busca uma pessoa pelo e-mail, ignorando case.
     */
    Optional<Pessoa> findByEmailIgnoreCase(String email);

    /**
     * Verifica se já existe uma pessoa com o e-mail informado (case-insensitive).
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Pessoa p WHERE LOWER(p.email) = LOWER(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    /**
     * Verifica se já existe outra pessoa (diferente de {@code excludeId}) com o mesmo e-mail.
     * Útil para validar unicidade em operações de atualização.
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Pessoa p WHERE LOWER(p.email) = LOWER(:email) AND p.codPessoa <> :excludeId")
    boolean existsByEmailIgnoreCaseAndCodPessoaNot(@Param("email") String email, @Param("excludeId") Long excludeId);
}
