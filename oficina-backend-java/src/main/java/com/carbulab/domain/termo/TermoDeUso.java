package com.carbulab.domain.termo;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidade que armazena a versão e o conteúdo em markdown dos termos de uso do sistema.
 * Mantém o histórico completo das versões publicadas.
 */
@Table(name = "tb_termos_de_uso")
@Entity(name = "TermoDeUso")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "codTermo")
public class TermoDeUso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_termo")
    private Long codTermo;

    @Column(name = "versao_termo", nullable = false, unique = true, length = 20)
    private String versaoTermo;

    @Column(name = "conteudo_termo", nullable = false, columnDefinition = "TEXT")
    private String conteudoTermo;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    public TermoDeUso(String versaoTermo, String conteudoTermo, LocalDateTime criadoEm) {
        this.versaoTermo = versaoTermo;
        this.conteudoTermo = conteudoTermo;
        this.criadoEm = criadoEm;
    }
}
