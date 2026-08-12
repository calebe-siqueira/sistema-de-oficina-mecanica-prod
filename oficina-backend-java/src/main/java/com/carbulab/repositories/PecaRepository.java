package com.carbulab.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.carbulab.domain.ordem_servico.Peca;
import java.util.List;
import java.util.Optional;

public interface PecaRepository extends JpaRepository<Peca, Integer> {
    Optional<Peca> findByNomePeca(String nomePeca);
    List<Peca> findAllByOrderByNomePecaAsc();
}
