package com.carbulab.dto.termo;

import java.time.LocalDateTime;

public record StatusTermosDTO(
    Boolean aceito,
    Long cod_termo_atual,
    String versao_atual,
    String versao_aceita,
    LocalDateTime aceito_em,
    Boolean necessita_aceite
) {
    public Boolean termos_aceitos() {
        return aceito;
    }
}
