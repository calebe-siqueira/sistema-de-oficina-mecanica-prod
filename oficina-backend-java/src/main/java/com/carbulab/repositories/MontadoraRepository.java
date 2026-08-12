package com.carbulab.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.carbulab.domain.veiculo.Montadora;
import java.util.Optional;
import java.util.List;

public interface MontadoraRepository extends JpaRepository<Montadora, Integer> {

    @Query("SELECT m FROM Montadora m WHERE LOWER(m.nomeMontadora) = LOWER(:nome)")
    Optional<Montadora> findByNomeIgnorandoCaixa(@Param("nome") String nome);

    @Query("SELECT m FROM Montadora m ORDER BY m.nomeMontadora ASC")
    List<Montadora> listarTodas();
}
