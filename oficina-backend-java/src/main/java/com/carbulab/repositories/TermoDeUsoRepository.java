package com.carbulab.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.carbulab.domain.termo.TermoDeUso;

public interface TermoDeUsoRepository extends JpaRepository<TermoDeUso, Long> {

    Optional<TermoDeUso> findByVersaoTermo(String versaoTermo);

    @Query(value = "SELECT * FROM tb_termos_de_uso ORDER BY criado_em DESC, cod_termo DESC LIMIT 1", nativeQuery = true)
    Optional<TermoDeUso> findTermoMaisRecente();

    boolean existsByVersaoTermo(String versaoTermo);
}
