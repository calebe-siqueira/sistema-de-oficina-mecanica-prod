package com.carbulab.exception;

/**
 * Exceção lançada quando um usuário autenticado tenta realizar operações no sistema
 * sem ter aceitado os termos de uso vigentes.
 */
public class TermosNaoAceitosException extends RuntimeException {

    public TermosNaoAceitosException(String message) {
        super(message);
    }

    public TermosNaoAceitosException(String message, Throwable cause) {
        super(message, cause);
    }
}
