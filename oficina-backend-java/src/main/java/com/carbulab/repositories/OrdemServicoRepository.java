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
import com.carbulab.domain.ordem_servico.OrdemServico;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Integer>, JpaSpecificationExecutor<OrdemServico> {
    
    @Query("SELECT os FROM OrdemServico os WHERE os.veiculo.cliente.cod_cliente = :codCliente AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL AND os.veiculo.cliente.deletedAt IS NULL")
    List<OrdemServico> findByClienteIdAtivas(@Param("codCliente") Long codCliente);

    @Query(
        value = "SELECT os FROM OrdemServico os WHERE os.veiculo.cliente.cod_cliente = :codCliente AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL AND os.veiculo.cliente.deletedAt IS NULL ORDER BY os.dataOs DESC, os.codOs DESC",
        countQuery = "SELECT count(os) FROM OrdemServico os WHERE os.veiculo.cliente.cod_cliente = :codCliente AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL AND os.veiculo.cliente.deletedAt IS NULL"
    )
    Page<OrdemServico> findByClienteIdAtivasPaged(@Param("codCliente") Long codCliente, Pageable pageable);

    @Query("SELECT COUNT(os) FROM OrdemServico os WHERE os.veiculo.cliente.cod_cliente = :codCliente AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL AND os.veiculo.cliente.deletedAt IS NULL")
    Long countByClienteIdAtivas(@Param("codCliente") Long codCliente);

    @Query(
        value = "SELECT os FROM OrdemServico os WHERE os.veiculo.cliente.cod_cliente = :codCliente AND (UPPER(REPLACE(os.veiculo.placa, '-', '')) LIKE CONCAT('%', :termo1, '%') OR UPPER(REPLACE(os.veiculo.placa, '-', '')) LIKE CONCAT('%', :termo2, '%')) AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL AND os.veiculo.cliente.deletedAt IS NULL ORDER BY os.dataOs DESC, os.codOs DESC",
        countQuery = "SELECT count(os) FROM OrdemServico os WHERE os.veiculo.cliente.cod_cliente = :codCliente AND (UPPER(REPLACE(os.veiculo.placa, '-', '')) LIKE CONCAT('%', :termo1, '%') OR UPPER(REPLACE(os.veiculo.placa, '-', '')) LIKE CONCAT('%', :termo2, '%')) AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL AND os.veiculo.cliente.deletedAt IS NULL"
    )
    Page<OrdemServico> findByClienteIdAndVeiculoPlacaLikeAtivasPaged(@Param("codCliente") Long codCliente, @Param("termo1") String termo1, @Param("termo2") String termo2, Pageable pageable);

    @Query("SELECT os FROM OrdemServico os WHERE os.veiculo.cod_veiculo = :codVeiculo AND os.statusServico = 4 AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL ORDER BY os.dataOs DESC, os.codOs DESC")
    List<OrdemServico> findUltimaOsFinalizadaPorVeiculo(@Param("codVeiculo") Integer codVeiculo, Pageable pageable);

    @Query("SELECT os FROM OrdemServico os WHERE os.veiculo.cod_veiculo = :codVeiculo AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL")
    List<OrdemServico> findByVeiculoIdAtivas(@Param("codVeiculo") Integer codVeiculo);

    @Query("SELECT COUNT(os) FROM OrdemServico os WHERE os.veiculo.cod_veiculo = :codVeiculo AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL")
    Long countByVeiculoIdAtivas(@Param("codVeiculo") Integer codVeiculo);

    @Query("SELECT COUNT(os) FROM OrdemServico os WHERE os.statusServico = :status AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL")
    Long countByStatusServicoAndDeletedAtIsNull(@Param("status") Integer status);

    @Query(value = "SELECT COUNT(os.cod_os) FROM tb_ordem_servico os JOIN tb_veiculo v ON os.fk_cod_veiculo = v.cod_veiculo WHERE os.status_servico = :status AND MONTH(os.data_os) = MONTH(CURDATE()) AND YEAR(os.data_os) = YEAR(CURDATE()) AND os.deleted_at IS NULL AND v.deleted_at IS NULL", nativeQuery = true)
    Long countConcluidasMesAtual(@Param("status") Integer status);

    @Query("SELECT os FROM OrdemServico os WHERE os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL ORDER BY os.dataOs DESC, os.codOs DESC")
    Page<OrdemServico> findAllAtivas(Pageable pageable);

    @Query("SELECT os FROM OrdemServico os WHERE os.statusServico = :status AND os.deletedAt IS NULL AND os.veiculo.deletedAt IS NULL ORDER BY os.dataOs DESC, os.codOs DESC")
    Page<OrdemServico> findByStatusAtivas(@Param("status") Integer status, Pageable pageable);

    // RESTORE OS
    @Modifying
    @Query(value = "UPDATE tb_ordem_servico SET deleted_at = NULL WHERE cod_os = :id", nativeQuery = true)
    void restoreOs(@Param("id") Integer id);

    @Modifying
    @Query(value = "UPDATE tb_os_peca SET deleted_at = NULL WHERE fk_cod_os = :id AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restorePecasByOs(@Param("id") Integer id, @Param("deletedAt") LocalDateTime deletedAt);

    @Modifying
    @Query(value = "UPDATE tb_os_servico SET deleted_at = NULL WHERE fk_cod_os = :id AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreServicosByOs(@Param("id") Integer id, @Param("deletedAt") LocalDateTime deletedAt);

    // RESTORE POR VEICULO
    @Modifying
    @Query(value = "UPDATE tb_ordem_servico SET deleted_at = NULL WHERE fk_cod_veiculo = :veiculoId AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreByVeiculoId(@Param("veiculoId") Integer veiculoId, @Param("deletedAt") LocalDateTime deletedAt);

    @Modifying
    @Query(value = "UPDATE tb_os_peca SET deleted_at = NULL WHERE fk_cod_os IN (SELECT cod_os FROM tb_ordem_servico WHERE fk_cod_veiculo = :veiculoId) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restorePecasByVeiculoId(@Param("veiculoId") Integer veiculoId, @Param("deletedAt") LocalDateTime deletedAt);

    @Modifying
    @Query(value = "UPDATE tb_os_servico SET deleted_at = NULL WHERE fk_cod_os IN (SELECT cod_os FROM tb_ordem_servico WHERE fk_cod_veiculo = :veiculoId) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreServicosByVeiculoId(@Param("veiculoId") Integer veiculoId, @Param("deletedAt") LocalDateTime deletedAt);

    // RESTORE POR CLIENTE
    @Modifying
    @Query(value = "UPDATE tb_ordem_servico SET deleted_at = NULL WHERE fk_cod_veiculo IN (SELECT cod_veiculo FROM tb_veiculo WHERE fk_cod_cliente = :clienteId) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreByClienteId(@Param("clienteId") Long clienteId, @Param("deletedAt") LocalDateTime deletedAt);

    @Modifying
    @Query(value = "UPDATE tb_os_peca SET deleted_at = NULL WHERE fk_cod_os IN (SELECT cod_os FROM tb_ordem_servico WHERE fk_cod_veiculo IN (SELECT cod_veiculo FROM tb_veiculo WHERE fk_cod_cliente = :clienteId)) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restorePecasByClienteId(@Param("clienteId") Long clienteId, @Param("deletedAt") LocalDateTime deletedAt);

    @Modifying
    @Query(value = "UPDATE tb_os_servico SET deleted_at = NULL WHERE fk_cod_os IN (SELECT cod_os FROM tb_ordem_servico WHERE fk_cod_veiculo IN (SELECT cod_veiculo FROM tb_veiculo WHERE fk_cod_cliente = :clienteId)) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, :deletedAt)) <= 5", nativeQuery = true)
    void restoreServicosByClienteId(@Param("clienteId") Long clienteId, @Param("deletedAt") LocalDateTime deletedAt);

    // SELECT LIXEIRA
    @Query(value = "SELECT * FROM tb_ordem_servico WHERE deleted_at IS NOT NULL", countQuery = "SELECT count(*) FROM tb_ordem_servico WHERE deleted_at IS NOT NULL", nativeQuery = true)
    Page<OrdemServico> findAllDeleted(Pageable pageable);

    @Modifying
    @Query(value = "DELETE FROM tb_ordem_servico WHERE cod_os = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    int deletarPermanentemente(@Param("id") Integer id);
}
