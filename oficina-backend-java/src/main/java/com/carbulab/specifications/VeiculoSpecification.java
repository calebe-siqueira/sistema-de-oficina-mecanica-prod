package com.carbulab.specifications;

import org.springframework.data.jpa.domain.Specification;
import com.carbulab.domain.veiculo.Veiculo;

public class VeiculoSpecification {

    public static Specification<Veiculo> ativo() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<Veiculo> porPlaca(String termo) {
        return com.carbulab.utils.ConsultaPorPlaca.criarSpecificationPorPlaca(root -> root.get("placa"), termo);
    }

    public static Specification<Veiculo> porMontadora(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("modelo").join("montadora").get("nomeMontadora")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<Veiculo> porModelo(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("modelo").get("nomeModelo")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<Veiculo> porAno(Integer ano) {
        return (root, query, cb) -> cb.equal(root.get("ano"), ano);
    }

    public static Specification<Veiculo> porCor(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.get("cor")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<Veiculo> porNomeCliente(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("cliente").join("pessoa").get("nome")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<Veiculo> porCodCliente(Long cod) {
        return (root, query, cb) -> cb.equal(root.join("cliente").get("cod_cliente"), cod);
    }

    public static Specification<Veiculo> porCpfCnpj(String termo) {
        String clean = termo.replaceAll("[^0-9]", "");
        return (root, query, cb) -> cb.like(root.join("cliente").get("cpf_cnpj"), "%" + clean + "%");
    }

    public static Specification<Veiculo> porTelefone(String termo) {
        String clean = termo.replaceAll("[^0-9]", "");
        return (root, query, cb) -> {
            var cliente = root.join("cliente");
            return cb.or(
                cb.like(cliente.get("celular"), "%" + clean + "%"),
                cb.like(cliente.get("telefone"), "%" + clean + "%")
            );
        };
    }

    public static Specification<Veiculo> dinamico(String tipo, String termo) {
        if (termo == null || termo.isBlank()) {
            return ativo();
        }
        Specification<Veiculo> spec = ativo();
        
        switch (tipo != null ? tipo.toLowerCase() : "") {
            case "placa":
                return spec.and(porPlaca(termo));
            case "montadora":
                return spec.and(porMontadora(termo));
            case "modelo":
                return spec.and(porModelo(termo));
            case "ano":
                try {
                    return spec.and(porAno(Integer.parseInt(termo)));
                } catch (NumberFormatException e) {
                    return spec;
                }
            case "cor":
                return spec.and(porCor(termo));
            case "cod_cliente":
                try {
                    return spec.and(porCodCliente(Long.parseLong(termo.replaceAll("[^0-9]", ""))));
                } catch (NumberFormatException e) {
                    return spec;
                }
            case "nome":
            case "nome_cliente":
                return spec.and(porNomeCliente(termo));
            case "cpf_cnpj":
                return spec.and(porCpfCnpj(termo));
            case "telefone":
                return spec.and(porTelefone(termo));
            default:
                return spec;
        }
    }
}
