package com.carbulab.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.carbulab.domain.veiculo.Veiculo;

public interface VeiculoRepository extends JpaRepository<Veiculo, Integer>, JpaSpecificationExecutor<Veiculo> {
    
    List<Veiculo> findByPlacaInAndDeletedAtIsNull(List<String> placas);
    
    @Query("SELECT v FROM Veiculo v WHERE v.cliente.cod_cliente = :clienteId AND v.deletedAt IS NULL")
    List<Veiculo> findByClienteIdAtivo(@Param("clienteId") Long clienteId);

    @Query(
        value = "SELECT v FROM Veiculo v LEFT JOIN FETCH v.modelo m LEFT JOIN FETCH m.montadora WHERE v.cliente.cod_cliente = :clienteId AND v.deletedAt IS NULL",
        countQuery = "SELECT count(v) FROM Veiculo v WHERE v.cliente.cod_cliente = :clienteId AND v.deletedAt IS NULL"
    )
    Page<Veiculo> findByClienteIdAtivoPaged(@Param("clienteId") Long clienteId, Pageable pageable);

    @Query("SELECT COUNT(v) FROM Veiculo v WHERE v.cliente.cod_cliente = :clienteId AND v.deletedAt IS NULL")
    Long countByClienteIdAndDeletedAtIsNull(@Param("clienteId") Long clienteId);

    @Query(
        value = "SELECT v FROM Veiculo v LEFT JOIN FETCH v.modelo m LEFT JOIN FETCH m.montadora WHERE v.cliente.cod_cliente = :clienteId AND (UPPER(REPLACE(v.placa, '-', '')) LIKE CONCAT('%', :termo1, '%') OR UPPER(REPLACE(v.placa, '-', '')) LIKE CONCAT('%', :termo2, '%')) AND v.deletedAt IS NULL",
        countQuery = "SELECT count(v) FROM Veiculo v WHERE v.cliente.cod_cliente = :clienteId AND (UPPER(REPLACE(v.placa, '-', '')) LIKE CONCAT('%', :termo1, '%') OR UPPER(REPLACE(v.placa, '-', '')) LIKE CONCAT('%', :termo2, '%')) AND v.deletedAt IS NULL"
    )
    Page<Veiculo> findByClienteIdAndPlacaLikeAtivo(@Param("clienteId") Long clienteId, @Param("termo1") String termo1, @Param("termo2") String termo2, Pageable pageable);

    Long countByDeletedAtIsNull();

    @Modifying
    @Query(value = "UPDATE tb_veiculo SET deleted_at = NULL WHERE cod_veiculo = :id", nativeQuery = true)
    void restoreVeiculo(@Param("id") Integer id);

    @Modifying
    @Query(value = "UPDATE tb_veiculo SET deleted_at = NULL WHERE fk_cod_cliente = :clienteId AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreByClienteId(@Param("clienteId") Long clienteId, @Param("deletedAt") LocalDateTime deletedAt);

    @Query(value = "SELECT * FROM tb_veiculo WHERE deleted_at IS NOT NULL", countQuery = "SELECT count(*) FROM tb_veiculo WHERE deleted_at IS NOT NULL", nativeQuery = true)
    Page<Veiculo> findAllDeleted(Pageable pageable);

    @Modifying
    @Query(value = "DELETE FROM tb_veiculo WHERE cod_veiculo = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    int deletarPermanentemente(@Param("id") Integer id);
}
