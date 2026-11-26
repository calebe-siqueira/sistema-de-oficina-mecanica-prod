package com.carbulab.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por gerar, armazenar e validar códigos temporários de verificação
 * (para alteração de e-mail e recuperação de senha).
 */
@Service
public class VerificationCodeService {

    private static final int EXPIRATION_MINUTES = 15;
    private static final int MAX_ATTEMPTS = 5;
    private final SecureRandom random = new SecureRandom();

    public record EmailChangeEntry(String novoEmail, String codigo, Instant expiresAt, int tentativas) {}
    public record PasswordResetEntry(String identifier, String codigo, Instant expiresAt, int tentativas) {}

    private final Map<Long, EmailChangeEntry> emailChangeCodes = new ConcurrentHashMap<>();
    private final Map<String, PasswordResetEntry> passwordResetCodes = new ConcurrentHashMap<>();

    /**
     * Gera e armazena um código de 6 dígitos para solicitação de troca de e-mail.
     */
    public String gerarCodigoTrocaEmail(Long codCliente, String novoEmail) {
        String codigo = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);
        emailChangeCodes.put(codCliente, new EmailChangeEntry(novoEmail.trim().toLowerCase(), codigo, expiresAt, 0));
        return codigo;
    }

    /**
     * Valida o código de verificação para troca de e-mail.
     */
    public boolean validarCodigoTrocaEmail(Long codCliente, String novoEmail, String codigo) {
        EmailChangeEntry entry = emailChangeCodes.get(codCliente);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            emailChangeCodes.remove(codCliente);
            return false;
        }

        if (entry.tentativas() >= MAX_ATTEMPTS) {
            emailChangeCodes.remove(codCliente);
            return false;
        }

        boolean emailBate = entry.novoEmail().equalsIgnoreCase(novoEmail.trim());
        boolean codigoBate = entry.codigo().equals(codigo.trim());

        if (emailBate && codigoBate) {
            return true;
        }

        // Incrementa tentativas incorretas
        emailChangeCodes.put(codCliente, new EmailChangeEntry(
            entry.novoEmail(), entry.codigo(), entry.expiresAt(), entry.tentativas() + 1
        ));
        return false;
    }

    /**
     * Invalida o código de troca de e-mail após uso bem-sucedido.
     */
    public void invalidarCodigoTrocaEmail(Long codCliente) {
        emailChangeCodes.remove(codCliente);
    }

    /**
     * Gera e armazena um código de 6 dígitos para solicitação de recuperação de senha.
     */
    public String gerarCodigoRecuperacaoSenha(String emailOuLogin) {
        String key = emailOuLogin.trim().toLowerCase();
        String codigo = String.format("%06d", random.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);
        passwordResetCodes.put(key, new PasswordResetEntry(key, codigo, expiresAt, 0));
        return codigo;
    }

    /**
     * Valida o código de recuperação de senha.
     */
    public boolean validarCodigoRecuperacaoSenha(String emailOuLogin, String codigo) {
        String key = emailOuLogin.trim().toLowerCase();
        PasswordResetEntry entry = passwordResetCodes.get(key);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            passwordResetCodes.remove(key);
            return false;
        }

        if (entry.tentativas() >= MAX_ATTEMPTS) {
            passwordResetCodes.remove(key);
            return false;
        }

        if (entry.codigo().equals(codigo.trim())) {
            return true;
        }

        passwordResetCodes.put(key, new PasswordResetEntry(
            entry.identifier(), entry.codigo(), entry.expiresAt(), entry.tentativas() + 1
        ));
        return false;
    }

    /**
     * Invalida o código de recuperação de senha após redefinição com sucesso.
     */
    public void invalidarCodigoRecuperacaoSenha(String emailOuLogin) {
        passwordResetCodes.remove(emailOuLogin.trim().toLowerCase());
    }
}
