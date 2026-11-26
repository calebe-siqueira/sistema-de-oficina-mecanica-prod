package com.carbulab.dto.common;

import jakarta.validation.valueextraction.ExtractedValue;
import jakarta.validation.valueextraction.UnwrapByDefault;
import jakarta.validation.valueextraction.ValueExtractor;

/**
 * Integra {@link PatchField} ao Jakarta Bean Validation.
 *
 * <p>Extrai o valor interno apenas quando o campo foi informado na requisição,
 * permitindo que anotações como {@code @Pattern}, {@code @Size} e {@code @Valid}
 * validem apenas campos presentes (ignorando campos omitidos).</p>
 */
@UnwrapByDefault
public class PatchFieldValueExtractor implements ValueExtractor<PatchField<@ExtractedValue ?>> {

    @Override
    public void extractValues(PatchField<?> originalValue, ValueReceiver receiver) {
        if (originalValue != null && originalValue.isPresent()) {
            receiver.value(null, originalValue.get());
        }
    }
}
