package com.carbulab.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.carbulab.domain.veiculo.Modelo;
import java.util.Optional;
import java.util.List;

public interface ModeloRepository extends JpaRepository<Modelo, Integer> {
    
    @Query("SELECT m FROM Modelo m WHERE LOWER(m.nomeModelo) = LOWER(:nome) AND m.montadora.codMontadora = :codMontadora")
    Optional<Modelo> findByNomeIgnorandoCaixaAndMontadora(@Param("nome") String nome, @Param("codMontadora") Integer codMontadora);

    @Query("SELECT m FROM Modelo m WHERE m.montadora.codMontadora = :codMontadora ORDER BY m.nomeModelo ASC")
    List<Modelo> listarPorMontadora(@Param("codMontadora") Integer codMontadora);
}
