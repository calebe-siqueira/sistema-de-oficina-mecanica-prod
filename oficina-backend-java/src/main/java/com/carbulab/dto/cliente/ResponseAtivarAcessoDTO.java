package com.carbulab.dto.cliente;

/**
 * Resposta da ativação de acesso do cliente.
 */
public record ResponseAtivarAcessoDTO(
    String login,
    String senhaTemporaria,
    boolean emailEnviado,
    String mensagem
) {}
