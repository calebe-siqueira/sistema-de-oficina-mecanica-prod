package com.carbulab.domain.ordem_servico;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "tb_os_servico")
@SQLDelete(sql = "UPDATE tb_os_servico SET deleted_at = CURRENT_TIMESTAMP WHERE cod_os_servico = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OsServico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer cod_os_servico;

    @ManyToOne
    @JoinColumn(name = "fk_cod_os", nullable = false)
    private OrdemServico ordemServico;

    @ManyToOne
    @JoinColumn(name = "fk_cod_servico", nullable = false)
    private Servico servico;

    @Column(nullable = false)
    private Integer quantidade = 1;

    @Column(name = "valor_unitario", nullable = false)
    private BigDecimal valorUnitario = BigDecimal.ZERO;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
