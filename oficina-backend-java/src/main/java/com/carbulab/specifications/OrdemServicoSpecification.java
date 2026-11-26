package com.carbulab.specifications;

import org.springframework.data.jpa.domain.Specification;
import com.carbulab.domain.ordem_servico.OrdemServico;
import java.time.LocalDate;

public class OrdemServicoSpecification {

    public static Specification<OrdemServico> ativo() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<OrdemServico> veiculoAtivo() {
        return (root, query, cb) -> cb.isNull(root.join("veiculo").get("deletedAt"));
    }

    public static Specification<OrdemServico> porStatus(Integer status) {
        return (root, query, cb) -> cb.equal(root.get("statusServico"), status);
    }

    public static Specification<OrdemServico> porIntervaloData(LocalDate dataInicio, LocalDate dataFim) {
        return (root, query, cb) -> cb.between(root.get("dataOs"), dataInicio, dataFim);
    }

    public static Specification<OrdemServico> porData(LocalDate data) {
        return (root, query, cb) -> cb.equal(root.get("dataOs"), data);
    }

    public static Specification<OrdemServico> porPlaca(String termo) {
        return com.carbulab.utils.ConsultaPorPlaca.criarSpecificationPorPlaca(root -> root.join("veiculo").get("placa"), termo);
    }

    public static Specification<OrdemServico> porMontadora(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("veiculo").join("modelo").join("montadora").get("nomeMontadora")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<OrdemServico> porModelo(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("veiculo").join("modelo").get("nomeModelo")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<OrdemServico> porAno(Integer ano) {
        return (root, query, cb) -> cb.equal(root.join("veiculo").get("ano"), ano);
    }

    public static Specification<OrdemServico> porCor(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("veiculo").get("cor")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<OrdemServico> porCodVeiculo(Integer cod) {
        return (root, query, cb) -> cb.equal(root.join("veiculo").get("cod_veiculo"), cod);
    }

    public static Specification<OrdemServico> porCodOs(Integer cod) {
        return (root, query, cb) -> cb.equal(root.get("codOs"), cod);
    }

    public static Specification<OrdemServico> porNomeCliente(String termo) {
        return (root, query, cb) -> 
            cb.like(cb.lower(root.join("veiculo").join("cliente").join("pessoa").get("nome")), "%" + termo.toLowerCase() + "%");
    }

    public static Specification<OrdemServico> porCodCliente(Long cod) {
        return (root, query, cb) -> cb.equal(root.join("veiculo").join("cliente").get("cod_cliente"), cod);
    }

    public static Specification<OrdemServico> dinamico(Long clienteId, String tipo, String termo, LocalDate dataInicio, LocalDate dataFim, String status) {
        Specification<OrdemServico> spec = Specification.where(ativo()).and(veiculoAtivo());

        if (clienteId != null) {
            spec = spec.and(porCodCliente(clienteId));
        }

        if (status != null && !status.equals("Todas")) {
            if (!status.startsWith("pag_")) {
                try {
                    spec = spec.and(porStatus(Integer.parseInt(status)));
                } catch(NumberFormatException e) {
                    // Ignora se não for número
                }
            }
            // OBS: status "pag_" (pagamento pendente/pago) dependem de valor_total calculado.
            // Para simplificar e manter a compatibilidade com a páginação SQL, essa lógica
            // poderia requerer subqueries complexas na Specification.
        }

        if (dataInicio != null && dataFim != null) {
            spec = spec.and(porIntervaloData(dataInicio, dataFim));
        }

        if (tipo != null && termo != null && !termo.isBlank()) {
            switch (tipo.toLowerCase()) {
                case "cod_os":
                    try { spec = spec.and(porCodOs(Integer.parseInt(termo))); } catch (Exception e) {}
                    break;
                case "data":
                    try { spec = spec.and(porData(LocalDate.parse(termo))); } catch (Exception e) {}
                    break;
                case "placa":
                    spec = spec.and(porPlaca(termo));
                    break;
                case "montadora":
                    spec = spec.and(porMontadora(termo));
                    break;
                case "modelo":
                    spec = spec.and(porModelo(termo));
                    break;
                case "ano":
                    try { spec = spec.and(porAno(Integer.parseInt(termo))); } catch (Exception e) {}
                    break;
                case "cor":
                    spec = spec.and(porCor(termo));
                    break;
                case "cod_veiculo":
                    try { spec = spec.and(porCodVeiculo(Integer.parseInt(termo))); } catch (Exception e) {}
                    break;
                case "nome":
                case "nome_cliente":
                    spec = spec.and(porNomeCliente(termo));
                    break;
                case "cod_cliente":
                    try { spec = spec.and(porCodCliente(Long.parseLong(termo))); } catch (Exception e) {}
                    break;
            }
        }

        return spec;
    }

    public static Specification<OrdemServico> dinamico(String tipo, String termo, LocalDate dataInicio, LocalDate dataFim, String status) {
        return dinamico(null, tipo, termo, dataInicio, dataFim, status);
    }
}
