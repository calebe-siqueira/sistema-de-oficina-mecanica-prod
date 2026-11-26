package com.carbulab.domain.termo;

import java.time.LocalDateTime;

import com.carbulab.domain.usuario.Usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidade que registra a aceitação ou recusa dos termos de uso do sistema pelo usuário.
 * Armazena a versão dos termos, timestamp exato da ação, endereço IP e user-agent
 * em conformidade com as melhores práticas de auditoria e segurança da informação (LGPD/GDPR).
 */
@Table(name = "tb_aceitacao_termos_de_uso")
@Entity(name = "AceitacaoTermosDeUso")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "codAceitacao")
public class AceitacaoTermosDeUso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_aceitacao")
    private Long codAceitacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fk_cod_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fk_cod_termo", nullable = false)
    private TermoDeUso termo;

    @Column(name = "aceito_em", nullable = false)
    private LocalDateTime aceitoEm;

    @Column(name = "endereco_ip", nullable = false, length = 45)
    private String enderecoIp;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "aceito", nullable = false)
    private Boolean aceito;

    public AceitacaoTermosDeUso(Usuario usuario, TermoDeUso termo, LocalDateTime aceitoEm, String enderecoIp, String userAgent, Boolean aceito) {
        this.usuario = usuario;
        this.termo = termo;
        this.aceitoEm = aceitoEm;
        this.enderecoIp = enderecoIp;
        this.userAgent = userAgent;
        this.aceito = aceito;
    }
}
