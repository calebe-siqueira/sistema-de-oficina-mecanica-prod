package com.carbulab.exception;

/**
 * Exceção lançada quando ocorre algum erro ou impedimento no gerenciamento
 * de acesso do cliente ao sistema (ex.: dados obrigatórios ausentes, acesso já ativo).
 */
public class ClienteAccessException extends RuntimeException {
    
    public ClienteAccessException(String message) {
        super(message);
    }

    public ClienteAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
