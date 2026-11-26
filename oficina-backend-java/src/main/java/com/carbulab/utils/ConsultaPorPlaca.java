package com.carbulab.utils;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.jpa.domain.Specification;

import com.carbulab.exception.BusinessValidationException;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

/**
 * Utilitário centralizado para tratamento, padronização e conversão de placas veiculares brasileiras
 * (padrão antigo LLLNNNN e Mercosul LLLNLNN).
 *
 * Responsabilidades:
 * - Normalização de placas (remoção de caracteres especiais, espaços e padronização em maiúsculas).
 * - Conversão bidirecional segura (Antiga <-> Mercosul), mesmo para placas incompletas/parciais (a partir de 5 caracteres).
 * - Geração padronizada de variantes para consultas exatas (IN) e parciais (LIKE).
 * - Construção reutilizável de Specifications JPA (DRY e POO).
 */
public final class ConsultaPorPlaca {

    private ConsultaPorPlaca() {
        // Construtor privado para classe utilitária
    }

    /**
     * Objeto de valor imutável que encapsula os termos de busca para consultas flexíveis.
     * termo1: termo original normalizado.
     * termo2: termo convertido no formato alternativo (se houver conversão válida) ou o próprio termo1.
     */
    public record TermosConsultaPlaca(String termoOriginal, String termoConvertido) {
        public String termo1() {
            return termoOriginal != null ? termoOriginal : "";
        }

        public String termo2() {
            return (termoConvertido != null && !termoConvertido.isBlank()) ? termoConvertido : termo1();
        }

        public boolean possuiConversao() {
            return termoConvertido != null && !termoConvertido.equalsIgnoreCase(termoOriginal);
        }

        public List<String> comoLista() {
            if (possuiConversao()) {
                return List.of(termo1(), termo2());
            }
            return !termo1().isBlank() ? List.of(termo1()) : List.of();
        }
    }

    /**
     * Normaliza uma placa removendo hífens, espaços e convertendo para maiúsculas.
     */
    public static String normalizar(String placa) {
        if (placa == null) {
            return "";
        }
        return placa.replaceAll("[- ]", "").toUpperCase().trim();
    }

    /**
     * Retorna os termos normalizado e convertido para consultas flexíveis (ex: LIKE).
     * Suporta placas completas e parciais (a partir de 5 caracteres).
     * Para termos com menos de 5 caracteres (cujo prefixo é idêntico em ambos os padrões),
     * termo1 e termo2 representam o próprio termo normalizado.
     */
    public static TermosConsultaPlaca obterTermosConsulta(String termo) {
        String limpo = normalizar(termo);
        if (limpo.isBlank()) {
            return new TermosConsultaPlaca("", "");
        }
        String adaptada = obterPlacaAdaptadaSafe(limpo);
        return new TermosConsultaPlaca(limpo, adaptada);
    }

    /**
     * Retorna a lista de variantes equivalentes da placa (original normalizada + convertida, se houver).
     * Ideal para consultas exatas (IN) em persistência ou validação de unicidade.
     */
    public static List<String> obterVariantes(String termo) {
        return obterTermosConsulta(termo).comoLista();
    }

    /**
     * Mantido para compatibilidade prévia. Retorna a placa adaptada no formato inverso se conversível,
     * ou null se não houver conversão possível.
     */
    public static String obterPlacaAdaptadaSafe(String placa) {
        if (placa == null || placa.isBlank()) {
            return null;
        }
        try {
            String adaptada = adaptaPlacaParaFormatoInverso_MercosulAntigo(placa);
            String normalizada = normalizar(placa);
            if (adaptada != null && !adaptada.equalsIgnoreCase(normalizada)) {
                return adaptada;
            }
        } catch (Exception e) {
            // Ignora falhas de conversão e retorna null
        }
        return null;
    }

    /**
     * Converte uma placa do formato antigo para Mercosul ou vice-versa.
     * Suporta placas completas (7 caracteres) e placas parciais (de 5 a 6 caracteres).
     */
    public static String adaptaPlacaParaFormatoInverso_MercosulAntigo(String placa) {
        String limpa = normalizar(placa);
        if (limpa.length() >= 5 && limpa.length() <= 7) {
            char digitoASerTrocado = limpa.charAt(4);

            boolean mercosul = false;
            int valor = 0;
            try {
                valor = Integer.parseInt(String.valueOf(digitoASerTrocado));
            } catch (Exception e) {
                mercosul = true;
            }

            if (!mercosul) {
                return converteParaMercosul(limpa, valor);
            } else {
                try {
                    return converteParaAntigo(limpa, digitoASerTrocado);
                } catch (BusinessValidationException e) {
                    return limpa; // Não conversível para padrão antigo (nasceu Mercosul)
                }
            }
        }
        return null;
    }

    private static String converteParaMercosul(String placa, int numeroPlacaAntiga) {
        char novoDigito = switch (numeroPlacaAntiga) {
            case 0 -> 'A';
            case 1 -> 'B';
            case 2 -> 'C';
            case 3 -> 'D';
            case 4 -> 'E';
            case 5 -> 'F';
            case 6 -> 'G';
            case 7 -> 'H';
            case 8 -> 'I';
            case 9 -> 'J';
            default -> throw new IllegalArgumentException("Dígito inválido para conversão Mercosul: " + numeroPlacaAntiga);
        };
        String retorno = placa.substring(0, 4) + novoDigito;
        if (placa.length() > 5) {
            retorno += placa.substring(5);
        }
        return retorno;
    }

    private static String converteParaAntigo(String placa, char digitoASerTrocado) {
        int novoDigito = switch (digitoASerTrocado) {
            case 'A' -> 0;
            case 'B' -> 1;
            case 'C' -> 2;
            case 'D' -> 3;
            case 'E' -> 4;
            case 'F' -> 5;
            case 'G' -> 6;
            case 'H' -> 7;
            case 'I' -> 8;
            case 'J' -> 9;
            default -> throw new BusinessValidationException(
                    "A placa informada não pode ser convertida para o padrão antigo (a placa já nasceu no novo formato Mercosul)");
        };
        String retorno = placa.substring(0, 4) + novoDigito;
        if (placa.length() > 5) {
            retorno += placa.substring(5);
        }
        return retorno;
    }

    /**
     * Construtor reutilizável de Specification JPA para qualquer entidade que possua um atributo de placa.
     * Trata remoção de hífens/espaços na coluna do banco de dados e aplica a busca por LIKE considerando
     * todas as variantes da placa (antiga e Mercosul, completas ou parciais).
     */
    public static <T> Specification<T> criarSpecificationPorPlaca(
            Function<Root<T>, Expression<String>> pathPlacaFunction,
            String termo) {
        return (root, query, cb) -> {
            TermosConsultaPlaca termos = obterTermosConsulta(termo);
            if (termos.termo1().isBlank()) {
                return cb.conjunction();
            }

            Expression<String> pathPlaca = pathPlacaFunction.apply(root);
            // Expressão para limpar hífens e espaços da coluna do banco em tempo de query
            Expression<String> placaDbLimpa = cb.lower(
                cb.function("replace", String.class,
                    cb.function("replace", String.class, pathPlaca, cb.literal("-"), cb.literal("")),
                    cb.literal(" "), cb.literal("")
                )
            );

            Predicate p1 = cb.like(placaDbLimpa, "%" + termos.termo1().toLowerCase() + "%");
            if (termos.possuiConversao()) {
                Predicate p2 = cb.like(placaDbLimpa, "%" + termos.termo2().toLowerCase() + "%");
                return cb.or(p1, p2);
            }
            return p1;
        };
    }

    public static void buscarPlaca(String placa) {
        // Reservado para integração futura com API externa de consulta FIPE
    }
}
