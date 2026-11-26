package com.carbulab.dto.auth;

import java.time.LocalDateTime;

public record ResponseLoginDTO(
    Long id, 
    String nome_usuario, 
    String login, 
    String funcao, 
    Long cod_cliente,
    LocalDateTime ultimo_acesso,
    LocalDateTime ultima_alteracao_senha,
    Boolean termos_aceitos
) {
    public ResponseLoginDTO(Long id, String nome_usuario, String login, String funcao) {
        this(id, nome_usuario, login, funcao, null, null, null, false);
    }

    public ResponseLoginDTO(Long id, String nome_usuario, String login, String funcao, Long cod_cliente) {
        this(id, nome_usuario, login, funcao, cod_cliente, null, null, false);
    }
}
