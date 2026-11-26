package com.carbulab.dto.termo;

public record AceitarTermosDTO(
    String versao_termo,
    Boolean aceito,
    Boolean status
) {
    public AceitarTermosDTO(String versao_termo, Boolean aceito) {
        this(versao_termo, aceito, aceito);
    }

    public Boolean getValorAceito() {
        return aceito != null ? aceito : status;
    }
}
