package com.carbulab.dto.termo;

import java.time.LocalDateTime;

import com.carbulab.domain.termo.TermoDeUso;

public record TermosDeUsoDTO(
    Long cod_termo,
    String versao_termo,
    String conteudo_termo,
    LocalDateTime criado_em
) {
    public TermosDeUsoDTO(TermoDeUso termo) {
        this(
            termo.getCodTermo(),
            termo.getVersaoTermo(),
            termo.getConteudoTermo(),
            termo.getCriadoEm()
        );
    }
}
