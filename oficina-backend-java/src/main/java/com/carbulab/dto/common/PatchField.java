package com.carbulab.dto.common;

import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.function.Function;

import tools.jackson.databind.annotation.JsonDeserialize;

/**
 * Representa um campo tri-estado em DTOs de atualização parcial (PATCH / PUT parcial).
 *
 * <p>Diferente de {@link java.util.Optional}, distingue explicitamente três estados:</p>
 * <ul>
 *   <li><strong>Omitido</strong> ({@link #omitted()}): a propriedade não foi enviada no JSON — não alterar o valor atual.</li>
 *   <li><strong>Nulo explícito</strong> ({@link #ofNull()}): a propriedade foi enviada com valor {@code null} — limpar/anular o valor.</li>
 *   <li><strong>Valor presente</strong> ({@link #of(Object)}): a propriedade foi enviada com valor não nulo — atualizar para o novo valor.</li>
 * </ul>
 *
 * @param <T> tipo do valor encapsulado
 */
@JsonDeserialize(using = PatchFieldDeserializer.class)
public final class PatchField<T> {

    private static final PatchField<?> OMITTED = new PatchField<>(false, null);
    private static final PatchField<?> OF_NULL = new PatchField<>(true, null);

    private final boolean present;
    private final T value;

    private PatchField(boolean present, T value) {
        this.present = present;
        this.value = value;
    }

    /** Retorna uma instância representando um campo omitido na requisição. */
    @SuppressWarnings("unchecked")
    public static <T> PatchField<T> omitted() {
        return (PatchField<T>) OMITTED;
    }

    /** Retorna uma instância representando um campo enviado explicitamente como {@code null}. */
    @SuppressWarnings("unchecked")
    public static <T> PatchField<T> ofNull() {
        return (PatchField<T>) OF_NULL;
    }

    /**
     * Retorna uma instância representando um campo enviado na requisição.
     * Se {@code value} for {@code null}, representa um {@code null} explícito ({@link #ofNull()}).
     */
    public static <T> PatchField<T> of(T value) {
        return value == null ? ofNull() : new PatchField<>(true, value);
    }

    /** Normaliza uma referência possivelmente nula de {@code PatchField} para {@link #omitted()}. */
    public static <T> PatchField<T> safe(PatchField<T> field) {
        return field != null ? field : omitted();
    }

    /** Indica se o campo foi enviado na requisição (mesmo que com valor {@code null}). */
    public boolean isPresent() {
        return present;
    }

    /** Indica se o campo foi omitido da requisição. */
    public boolean isOmitted() {
        return !present;
    }

    /** Indica se o campo foi enviado explicitamente com valor {@code null}. */
    public boolean isNull() {
        return present && value == null;
    }

    /**
     * Retorna o valor enviado (que pode ser {@code null}).
     *
     * @throws NoSuchElementException se o campo tiver sido omitido
     */
    public T get() {
        if (!present) {
            throw new NoSuchElementException("Campo omitido na requisição");
        }
        return value;
    }

    /** Retorna o valor se o campo estiver presente (inclusive {@code null}), ou {@code fallbackWhenOmitted} se omitido. */
    public T valueOr(T fallbackWhenOmitted) {
        return present ? value : fallbackWhenOmitted;
    }

    /** Retorna o valor se estiver presente e não for {@code null}, ou {@code fallback} caso contrário. */
    public T nonNullOr(T fallback) {
        return (present && value != null) ? value : fallback;
    }

    /** Executa {@code action} caso o campo tenha sido enviado (incluindo quando o valor é {@code null}). */
    public void ifPresent(Consumer<? super T> action) {
        if (present) {
            action.accept(value);
        }
    }

    /** Transforma o valor interno se presente e não nulo; mantém {@link #omitted()} ou {@link #ofNull()}. */
    public <R> PatchField<R> map(Function<? super T, ? extends R> mapper) {
        if (!present) {
            return omitted();
        }
        if (value == null) {
            return ofNull();
        }
        return PatchField.of(mapper.apply(value));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PatchField<?> other)) return false;
        return present == other.present && Objects.equals(value, other.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(present, value);
    }

    @Override
    public String toString() {
        if (!present) {
            return "PatchField[omitted]";
        }
        return "PatchField[" + value + "]";
    }
}
