package com.carbulab.utils;

import java.util.Map;

public final class ConvesorDeMap {

    // Construtor privado impede que a classe seja instanciada com 'new'
    private ConvesorDeMap() {
        throw new UnsupportedOperationException("Classe utilitária não pode ser instanciada.");
    }

    /**
     * Recupera um valor de um mapa de forma genérica e segura.
     */
    @SuppressWarnings("unchecked")
    public static <T> T obterDoMapa(Map<String, Object> mapa, String chave, T valorPadrao) {
        Object valor = mapa.get(chave);
        if (valor == null) {
            return valorPadrao;
        }
        // O Java infere o tipo T automaticamente no retorno
        return (T) valor; 
    }
}
