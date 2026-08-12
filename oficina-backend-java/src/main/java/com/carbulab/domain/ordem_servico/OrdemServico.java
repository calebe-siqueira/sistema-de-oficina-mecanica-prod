package com.carbulab.domain.ordem_servico;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import com.carbulab.domain.veiculo.Veiculo;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "tb_ordem_servico")
@SQLDelete(sql = "UPDATE tb_ordem_servico SET deleted_at = CURRENT_TIMESTAMP WHERE cod_os = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrdemServico {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_os")
    private Integer codOs;
    
    @Column(name = "data_os", nullable = false)
    private LocalDate dataOs;
    
    private Integer quilometragem;
    
    @Column(length = 400)
    private String descricao;
    
    @Column(name = "tipo_desconto", length = 1)
    private String tipoDesconto = "N"; // 'N', 'P', 'V'
    
    private BigDecimal desconto = BigDecimal.ZERO;
    
    @ManyToOne
    @JoinColumn(name = "fk_cod_veiculo", nullable = false)
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Veiculo veiculo;
    
    @Column(name = "status_servico", nullable = false)
    private Integer statusServico = 1;
    
    @Column(name = "valor_pago")
    private BigDecimal valorPago = BigDecimal.ZERO;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OsPeca> pecas = new ArrayList<>();
    
    @OneToMany(mappedBy = "ordemServico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OsServico> servicos = new ArrayList<>();

    public void adicionarPeca(OsPeca osPeca) {
        pecas.add(osPeca);
        osPeca.setOrdemServico(this);
    }

    public String getDataFormatada() {
        DateTimeFormatter formatoData = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return this.getDataOs() != null ? this.getDataOs().format(formatoData) : null;
    }
    
    public void adicionarServico(OsServico osServico) {
        servicos.add(osServico);
        osServico.setOrdemServico(this);
    }
}
