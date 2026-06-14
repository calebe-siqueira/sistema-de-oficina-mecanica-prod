package com.carbulab.veiculo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório para Veículos
 * 
 * Operações CRUD básicas para a entidade Veiculo.
 * Buscas complexas são feitas via JdbcTemplate no ClienteService.
 */
@Repository
public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
}
