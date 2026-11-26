package com.carbulab.dto.termo;

import java.time.LocalDateTime;

import com.carbulab.domain.termo.AceitacaoTermosDeUso;

public record ResponseAceitacaoTermosDTO(
    Long cod_aceitacao,
    Long fk_cod_usuario,
    Long fk_cod_termo,
    String versao_termo,
    LocalDateTime aceito_em,
    String endereco_ip,
    String user_agent,
    Boolean aceito,
    String mensagem
) {
    public ResponseAceitacaoTermosDTO(AceitacaoTermosDeUso aceitacao, String mensagem) {
        this(
            aceitacao.getCodAceitacao(),
            aceitacao.getUsuario() != null ? aceitacao.getUsuario().getCod_usuario() : null,
            aceitacao.getTermo() != null ? aceitacao.getTermo().getCodTermo() : null,
            aceitacao.getTermo() != null ? aceitacao.getTermo().getVersaoTermo() : null,
            aceitacao.getAceitoEm(),
            aceitacao.getEnderecoIp(),
            aceitacao.getUserAgent(),
            aceitacao.getAceito(),
            mensagem
        );
    }
}
