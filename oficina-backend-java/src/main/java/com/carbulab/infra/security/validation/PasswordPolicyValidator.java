package com.carbulab.infra.security.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.passay.*;
import java.util.ArrayList;
import java.util.List;

public class PasswordPolicyValidator implements ConstraintValidator<ValidPasswordPolicy, PasswordPolicyTarget> {

    private boolean allowEmpty;
    private PasswordValidator validator;

    @Override
    public void initialize(ValidPasswordPolicy constraintAnnotation) {
        this.allowEmpty = constraintAnnotation.allowEmpty();

        List<Rule> rules = new ArrayList<>();
        // 1. Minimum Length
        rules.add(new LengthRule(8, 64));
        
        // 2. Character requirements
        rules.add(new CharacterRule(EnglishCharacterData.UpperCase, 1));
        rules.add(new CharacterRule(EnglishCharacterData.LowerCase, 1));
        rules.add(new CharacterRule(EnglishCharacterData.Digit, 1));
        rules.add(new CharacterRule(EnglishCharacterData.Special, 1));
        
        // 3. Illegal Sequences
        rules.add(new IllegalSequenceRule(EnglishSequenceData.Alphabetical, 5, false));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.Numerical, 5, false));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.USQwerty, 5, false));

        this.validator = new PasswordValidator(rules);
    }

    @Override
    public boolean isValid(PasswordPolicyTarget target, ConstraintValidatorContext context) {
        if (target == null) {
            return true;
        }

        String senha = target.getSenha();

        if (senha == null || senha.isBlank()) {
            if (allowEmpty) {
                return true;
            } else {
                setCustomMessage(context, "senha", "A senha é obrigatória.");
                return false;
            }
        }

        // Cross-field validation (login, email, nome)
        String senhaLower = senha.toLowerCase();
        
        if (target.getLogin() != null && !target.getLogin().isBlank()) {
            if (senhaLower.contains(target.getLogin().toLowerCase())) {
                setCustomMessage(context, "senha", "A senha não pode conter o seu login.");
                return false;
            }
        }
        
        if (target.getEmail() != null && !target.getEmail().isBlank()) {
            String emailPart = target.getEmail().split("@")[0].toLowerCase();
            if (senhaLower.contains(emailPart)) {
                setCustomMessage(context, "senha", "A senha não pode conter partes do seu email.");
                return false;
            }
        }
        
        if (target.getNome_usuario() != null && !target.getNome_usuario().isBlank()) {
            String primeiroNome = target.getNome_usuario().split(" ")[0].toLowerCase();
            if (senhaLower.contains(primeiroNome)) {
                setCustomMessage(context, "senha", "A senha não pode conter o seu nome.");
                return false;
            }
        }

        PasswordData passwordData = new PasswordData(senha);
        RuleResult result = validator.validate(passwordData);

        if (result.isValid()) {
            return true;
        }
		
        setCustomMessage(context, "senha", "A senha deve conter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.");
        return false;
    }

    private void setCustomMessage(ConstraintValidatorContext context, String node, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message)
               .addPropertyNode(node)
               .addConstraintViolation();
    }
}
