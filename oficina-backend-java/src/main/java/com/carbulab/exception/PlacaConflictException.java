package com.carbulab.exception;

import java.util.List;
import java.util.Map;

/**
 * Lançada quando uma placa já está cadastrada para outro(s) cliente(s).
 * 
 * Diferente de DuplicateResourceException (que indica erro definitivo),
 * esta exceção representa um conflito que pode ser ignorado pelo usuário
 * mediante confirmação explícita (parâmetro force=true na requisição).
 * 
 * Resulta em HTTP 409 Conflict com body rico contendo a lista de proprietários.
 */
public class PlacaConflictException extends RuntimeException {

    private final List<Map<String, Object>> outrosProprietarios;

    public PlacaConflictException(String message, List<Map<String, Object>> outrosProprietarios) {
        super(message);
        this.outrosProprietarios = outrosProprietarios;
    }

    public List<Map<String, Object>> getOutrosProprietarios() {
        return outrosProprietarios;
    }
}
