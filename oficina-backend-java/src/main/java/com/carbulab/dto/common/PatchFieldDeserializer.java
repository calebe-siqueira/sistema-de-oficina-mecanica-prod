package com.carbulab.dto.common;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.BeanProperty;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.util.AccessPattern;

/**
 * Desserializador Jackson 3 para {@link PatchField}.
 *
 * <p>Preserva a distinção entre propriedade ausente no JSON ({@link PatchField#omitted()})
 * e propriedade presente com valor {@code null} ({@link PatchField#ofNull()}).</p>
 */
public class PatchFieldDeserializer extends ValueDeserializer<PatchField<?>> {

    private final JavaType valueType;
    private final ValueDeserializer<Object> valueDeserializer;

    public PatchFieldDeserializer() {
        this(null, null);
    }

    private PatchFieldDeserializer(JavaType valueType, ValueDeserializer<Object> valueDeserializer) {
        this.valueType = valueType;
        this.valueDeserializer = valueDeserializer;
    }

    @Override
    public ValueDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) {
        JavaType wrapperType = property != null ? property.getType() : ctxt.getContextualType();
        JavaType innerType = (wrapperType != null && wrapperType.containedTypeCount() > 0)
                ? wrapperType.containedType(0)
                : ctxt.constructType(Object.class);

        ValueDeserializer<Object> innerDeserializer = ctxt.findContextualValueDeserializer(innerType, property);
        return new PatchFieldDeserializer(innerType, innerDeserializer);
    }

    @Override
    public PatchField<?> deserialize(JsonParser p, DeserializationContext ctxt) throws JacksonException {
        if (p.currentToken() == JsonToken.VALUE_NULL) {
            return PatchField.ofNull();
        }
        Object deserialized = (valueDeserializer != null)
                ? valueDeserializer.deserialize(p, ctxt)
                : ctxt.readValue(p, valueType);
        return PatchField.of(deserialized);
    }

    @Override
    public Object getNullValue(DeserializationContext ctxt) {
        return PatchField.ofNull();
    }

    @Override
    public AccessPattern getNullAccessPattern() {
        return AccessPattern.CONSTANT;
    }

    @Override
    public Object getAbsentValue(DeserializationContext ctxt) {
        return PatchField.omitted();
    }
}
