package com.carbulab.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbulab.domain.cliente.Cep;

public interface CepRepository extends JpaRepository<Cep, Long> {

	Optional<Cep> findByCep(String cep);
}
