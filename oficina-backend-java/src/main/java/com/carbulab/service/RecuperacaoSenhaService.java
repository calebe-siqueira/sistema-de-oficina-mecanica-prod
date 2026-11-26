package com.carbulab.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.EnglishSequenceData;
import org.passay.IllegalSequenceRule;
import org.passay.LengthRule;
import org.passay.PasswordData;
import org.passay.PasswordValidator;
import org.passay.Rule;
import org.passay.RuleResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.auth.ConfirmarRecuperacaoSenhaDTO;
import com.carbulab.dto.auth.SolicitarRecuperacaoSenhaDTO;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.repositories.UsuarioRepository;

/**
 * Serviço responsável pelo fluxo de recuperação de senha esquecida via código por e-mail.
 */
@Service
public class RecuperacaoSenhaService {

    private static final Logger logger = LoggerFactory.getLogger(RecuperacaoSenhaService.class);

    private final UsuarioRepository usuarioRepository;
    private final VerificationCodeService verificationCodeService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public RecuperacaoSenhaService(
            UsuarioRepository usuarioRepository,
            VerificationCodeService verificationCodeService,
            EmailService emailService,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.verificationCodeService = verificationCodeService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Solicita o código de recuperação de senha para o e-mail ou login informado.
     */
    public void solicitarRecuperacao(SolicitarRecuperacaoSenhaDTO dto) {
        String identifier = dto.email_ou_login().trim();
        Optional<Usuario> usuarioOpt = usuarioRepository.findByLoginIgnoreCaseOrEmailIgnoreCase(identifier, identifier);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (usuario.getEmail() != null && !usuario.getEmail().isBlank()) {
                String codigo = verificationCodeService.gerarCodigoRecuperacaoSenha(identifier);
                emailService.enviarCodigoRecuperacaoSenha(usuario.getEmail(), usuario.getNome(), codigo);
                logger.info("Código de recuperação gerado para o identificador '{}'", identifier);
            } else {
                logger.warn("Usuário '{}' não possui e-mail cadastrado para recuperação de senha.", identifier);
            }
        } else {
            logger.info("Tentativa de recuperação para identificador não cadastrado: '{}'", identifier);
        }
    }

    /**
     * Valida o código e redefine a senha do usuário.
     */
    @Transactional
    public void confirmarRecuperacao(ConfirmarRecuperacaoSenhaDTO dto) {
        String identifier = dto.email_ou_login().trim();
        boolean codigoValido = verificationCodeService.validarCodigoRecuperacaoSenha(identifier, dto.codigo());

        if (!codigoValido) {
            throw new BusinessValidationException("Código de recuperação inválido, incorreto ou expirado.");
        }

        Usuario usuario = usuarioRepository.findByLoginIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new BusinessValidationException("Usuário não encontrado."));

        validarPoliticaSenha(dto.nova_senha(), usuario);

        usuario.setSenha(passwordEncoder.encode(dto.nova_senha().trim()));
        usuario.setUltimaAlteracaoSenha(java.time.LocalDateTime.now());
        usuarioRepository.save(usuario);

        verificationCodeService.invalidarCodigoRecuperacaoSenha(identifier);
    }

    private void validarPoliticaSenha(String senha, Usuario usuario) {
        String senhaLower = senha.toLowerCase();

        if (usuario.getLogin() != null && !usuario.getLogin().isBlank()) {
            if (senhaLower.contains(usuario.getLogin().toLowerCase())) {
                throw new BusinessValidationException("A nova senha não pode conter o seu login.");
            }
        }

        if (usuario.getEmail() != null && !usuario.getEmail().isBlank()) {
            String emailPart = usuario.getEmail().split("@")[0].toLowerCase();
            if (senhaLower.contains(emailPart)) {
                throw new BusinessValidationException("A nova senha não pode conter partes do seu e-mail.");
            }
        }

        if (usuario.getNome() != null && !usuario.getNome().isBlank()) {
            String primeiroNome = usuario.getNome().split(" ")[0].toLowerCase();
            if (senhaLower.contains(primeiroNome)) {
                throw new BusinessValidationException("A nova senha não pode conter o seu nome.");
            }
        }

        List<Rule> rules = new ArrayList<>();
        rules.add(new LengthRule(8, 64));
        rules.add(new CharacterRule(EnglishCharacterData.UpperCase, 1));
        rules.add(new CharacterRule(EnglishCharacterData.LowerCase, 1));
        rules.add(new CharacterRule(EnglishCharacterData.Digit, 1));
        rules.add(new CharacterRule(EnglishCharacterData.Special, 1));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.Alphabetical, 5, false));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.Numerical, 5, false));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.USQwerty, 5, false));

        PasswordValidator validator = new PasswordValidator(rules);
        RuleResult result = validator.validate(new PasswordData(senha));

        if (!result.isValid()) {
            throw new BusinessValidationException("A nova senha deve conter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.");
        }
    }
}
