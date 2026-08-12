package com.carbulab.dto.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public record AuthenticationDTO(
    String login,
    String senha
) {
    @JsonCreator
    public AuthenticationDTO(
        @JsonProperty("login") String login, 
        @JsonProperty("senha") String senha
    ) {
        this.login = login;
        this.senha = senha;
    }
}
