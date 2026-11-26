package com.carbulab.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.carbulab.domain.termo.AceitacaoTermosDeUso;
import com.carbulab.domain.termo.TermoDeUso;
import com.carbulab.domain.usuario.Usuario;

public interface AceitacaoTermosDeUsoRepository extends JpaRepository<AceitacaoTermosDeUso, Long> {

    @Query("SELECT a FROM AceitacaoTermosDeUso a WHERE a.usuario = :usuario ORDER BY a.aceitoEm DESC")
    List<AceitacaoTermosDeUso> findAllByUsuarioOrderByAceitoEmDesc(@Param("usuario") Usuario usuario);

    @Query("SELECT a FROM AceitacaoTermosDeUso a WHERE a.usuario = :usuario AND a.termo = :termo ORDER BY a.aceitoEm DESC")
    List<AceitacaoTermosDeUso> findByUsuarioAndTermoOrderByAceitoEmDesc(@Param("usuario") Usuario usuario, @Param("termo") TermoDeUso termo);

    @Query(value = "SELECT * FROM tb_aceitacao_termos_de_uso WHERE fk_cod_usuario = :usuarioId ORDER BY aceito_em DESC LIMIT 1", nativeQuery = true)
    Optional<AceitacaoTermosDeUso> findUltimaPorUsuario(@Param("usuarioId") Long usuarioId);

    @Query(value = "SELECT * FROM tb_aceitacao_termos_de_uso WHERE fk_cod_usuario = :usuarioId AND fk_cod_termo = :termoId ORDER BY aceito_em DESC LIMIT 1", nativeQuery = true)
    Optional<AceitacaoTermosDeUso> findUltimaPorUsuarioETermo(@Param("usuarioId") Long usuarioId, @Param("termoId") Long termoId);
}
