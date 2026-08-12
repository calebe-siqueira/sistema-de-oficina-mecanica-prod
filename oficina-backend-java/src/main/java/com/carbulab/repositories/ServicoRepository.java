package com.carbulab.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.carbulab.domain.ordem_servico.Servico;
import java.util.List;
import java.util.Optional;

public interface ServicoRepository extends JpaRepository<Servico, Integer> {
    Optional<Servico> findByNomeServico(String nomeServico);
    List<Servico> findAllByOrderByNomeServicoAsc();
}
