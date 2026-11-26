package com.carbulab.infra.security.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Documented
@Constraint(validatedBy = PasswordPolicyValidator.class)
@Target({ TYPE })
@Retention(RUNTIME)
public @interface ValidPasswordPolicy {
    String message() default "A senha informada não atende aos requisitos de segurança ou é muito comum.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
    
    boolean allowEmpty() default false;
}
