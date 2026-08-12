package com.carbulab.infra.security;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.carbulab.domain.usuario.Usuario;
import com.carbulab.exception.TokenException;

@Service
public class TokenService {
    
  // @Value("${api.security.token.secret}")
  private String tokenSecret = "erjVi9CmVUY@}+_3h!*G5%)zmL@AaKzJW?rm:U-Do3V!8UxDnG.xzx?6}-?23%H}";

	// @Value("${api.security.token.expiration}")
	private Integer tokenExpiration = 1;

	// @Value("${api.security.refresh-token.expiration}")
	private Integer refreshTokenExpiration = 12;

    public String generateToken(Usuario usuario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(tokenSecret);
            String token = JWT.create()
                .withIssuer("auth-api")
                .withSubject(usuario.getLogin())
                .withClaim("type", "access")
                .withExpiresAt(genExpirationDate(tokenExpiration))
                .sign(algorithm);
            return token;
        } catch (JWTCreationException exception) {
            throw new TokenException("Erro ao gerar token", exception);
        }
    }

    public String generateRefreshToken(Usuario usuario) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(tokenSecret);
            String token = JWT.create()
                .withIssuer("auth-api")
                .withSubject(usuario.getLogin())
                .withClaim("type", "refresh")
                .withExpiresAt(genExpirationDate(refreshTokenExpiration))
                .sign(algorithm);
            return token;
        } catch (JWTCreationException exception) {
            throw new TokenException("Erro ao gerar refresh token", exception);
        }
    }

    public String validateToken(String token, String expectedType) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(tokenSecret);
            var decodedJWT = JWT.require(algorithm)
                    .withIssuer("auth-api")
                    .build()
                    .verify(token);
                    
            String type = decodedJWT.getClaim("type").asString();
            if (type == null || !type.equals(expectedType)) {
                throw new TokenException("Tipo de token inválido");
            }
            
            return decodedJWT.getSubject();
        } catch (JWTVerificationException exception) {
            throw new TokenException("Erro ao validar token", exception);
        }
    }

    private Instant genExpirationDate(Integer expirationHours) {
        return LocalDateTime.now().plusHours(expirationHours).toInstant(ZoneOffset.of("-03:00"));
    }

    public int getAccessTokenExpirationSeconds() {
        return tokenExpiration * 60 * 60;
    }

    public int getRefreshTokenExpirationSeconds() {
        return refreshTokenExpiration * 60 * 60;
    }
}
