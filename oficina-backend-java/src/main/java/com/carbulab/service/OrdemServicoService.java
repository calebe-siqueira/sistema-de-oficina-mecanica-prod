package com.carbulab.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.ordem_servico.OrdemServico;
import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.ordem_servico.OsPeca;
import com.carbulab.domain.ordem_servico.OsServico;
import com.carbulab.domain.ordem_servico.Peca;
import com.carbulab.domain.ordem_servico.Servico;
import com.carbulab.domain.veiculo.Modelo;
import com.carbulab.domain.veiculo.Veiculo;
import com.carbulab.dto.ordem_servico.CreateOsDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.ordem_servico.UpdateOsDTO;
import com.carbulab.dto.ordem_servico.UpdateOsDTO.ItemUpdateDTO;
import com.carbulab.dto.ordem_servico.SearchOsDTO;
import com.carbulab.specifications.OrdemServicoSpecification;
import com.carbulab.utils.ConsultaPorPlaca;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.repositories.PecaRepository;
import com.carbulab.repositories.ServicoRepository;
import com.carbulab.repositories.VeiculoRepository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository repository;
    private final VeiculoRepository veiculoRepository;
    private final PecaRepository pecaRepository;
    private final ServicoRepository servicoRepository;
    private final JdbcTemplate jdbcTemplate;

    // ===================== RESTORE (LIXEIRA) =======================

    @Transactional
    public void restaurar(Integer id) {
        // Impede restaurar se o veículo (ou o cliente do veículo) estiver na lixeira
        String checkSql = "SELECT v.deleted_at as veiculo_deleted, c.deleted_at as cliente_deleted FROM tb_ordem_servico os JOIN tb_veiculo v ON os.fk_cod_veiculo = v.cod_veiculo JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente WHERE os.cod_os = ?";
        try {
            java.util.Map<String, Object> map = jdbcTemplate.queryForMap(checkSql, id);
            if (map.get("cliente_deleted") != null) {
                throw new BusinessValidationException("Não é possível restaurar esta ordem de serviço pois o cliente associado ao veículo está na lixeira. Restaure o cliente primeiro.");
            }
            if (map.get("veiculo_deleted") != null) {
                throw new BusinessValidationException("Não é possível restaurar esta ordem de serviço pois o veículo associado a ela está na lixeira. Restaure o veículo primeiro.");
            }
        } catch (EmptyResultDataAccessException e) {
            // Ignora se não encontrar
        }

        String sql = "SELECT deleted_at FROM tb_ordem_servico WHERE cod_os = ?";
        Timestamp ts = jdbcTemplate.queryForObject(sql, Timestamp.class, id);
        LocalDateTime deletedAt = ts != null ? ts.toLocalDateTime() : LocalDateTime.now();

        repository.restoreOs(id);
        repository.restorePecasByOs(id, deletedAt);
        repository.restoreServicosByOs(id, deletedAt);
    }

    @Transactional
    public void deletarPermanentemente(Integer id) {
        try {
            int rows = repository.deletarPermanentemente(id);
            if (rows == 0) {
                throw new ResourceNotFoundException("Ordem de Serviço não encontrada na lixeira para exclusão permanente.");
            }
        } catch (DataIntegrityViolationException e) {
            throw new BusinessValidationException("Não é possível excluir permanentemente esta ordem de serviço, pois ela possui vínculos com outros dados do sistema.");
        }
    }

    public Page<ResponseOsDTO> listarLixeira(Pageable pageable) {
        return repository.findAllDeleted(pageable)
                .map(os -> {
                    ResponseOsDTO dto = new ResponseOsDTO(os, calcularValorTotal(os));
                    if (os.getVeiculo() == null) {
                        String sql = "SELECT v.placa, m.nome_modelo, c.cod_cliente, c.nome_cliente, v.cod_veiculo, v.ano, v.cor " +
                                     "FROM tb_ordem_servico os " +
                                     "JOIN tb_veiculo v ON os.fk_cod_veiculo = v.cod_veiculo " +
                                     "LEFT JOIN tb_modelo m ON v.fk_cod_modelo = m.cod_modelo " +
                                     "LEFT JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente " +
                                     "WHERE os.cod_os = ?";
                        try {
                            Map<String, Object> map = jdbcTemplate.queryForMap(sql, os.getCodOs());
                            dto = new ResponseOsDTO(
                                dto.codOs(), dto.dataOs(), dto.quilometragem(), dto.descricao(), dto.tipoDesconto(), dto.desconto(),
                                dto.valorTotal(), dto.valorPago(),
                                ((Number) map.get("cod_veiculo")).intValue(),
                                map.get("cod_cliente") != null ? ((Number) map.get("cod_cliente")).longValue() : null,
                                map.get("nome_cliente") != null ? (String) map.get("nome_cliente") : "Sem dono",
                                map.get("nome_modelo") != null ? new Modelo(null, (String) map.get("nome_modelo"), null) : null,
                                (String) map.get("placa"),
                                ((Number) map.get("ano")).intValue(),
                                (String) map.get("cor"),
                                dto.statusServico(),
                                dto.pecas(),
                                dto.servicos()
                            );
                        } catch (Exception e) {}
                    }
                    return dto;
                });
    }

    // ==============================================================

    public Page<ResponseOsDTO> listarTodos(Integer status, Pageable pageable) {
        if (status != null) {
            return repository.findByStatusAtivas(status, pageable)
                    .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)));
        }
        return repository.findAllAtivas(pageable)
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)));
    }

    public Page<ResponseOsDTO> buscar(SearchOsDTO search, Pageable pageable) {
        return repository.findAll(OrdemServicoSpecification.dinamico(search.clienteId(), search.tipo(), search.termo(), search.dataInicio(), search.dataFim(), search.status()), pageable)
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)));
    }

    public ResponseOsDTO buscarPorId(Integer codOs) {
        return repository.findById(codOs)
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)))
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço não encontrada com ID: " + codOs));
    }

    public BigDecimal calcularValorTotal(OrdemServico os) {
        BigDecimal totalPecas = os.getPecas().stream()
                .map(p -> p.getValorUnitario().multiply(new BigDecimal(p.getQuantidade())))
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
        BigDecimal totalServicos = os.getServicos().stream()
                .map(s -> s.getValorUnitario().multiply(new BigDecimal(s.getQuantidade())))
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
        BigDecimal total = totalPecas.add(totalServicos);

        if (os.getDesconto() != null) {
            if ("V".equals(os.getTipoDesconto())) {
                total = total.subtract(os.getDesconto());
            } else if ("P".equals(os.getTipoDesconto())) {
                BigDecimal descontoVal = total.multiply(os.getDesconto())
                        .divide(new BigDecimal(100));
                total = total.subtract(descontoVal);
            }
        }
        return total.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total;
    }

    @Transactional
    public ResponseOsDTO criar(CreateOsDTO dto) {
        Veiculo veiculo = veiculoRepository.findById(dto.fk_cod_veiculo())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Veículo não encontrado com ID: " + dto.fk_cod_veiculo()));

        OrdemServico os = new OrdemServico();
        os.setDataOs(dto.dataOs());
        os.setQuilometragem(dto.quilometragem());
        os.setDescricao(dto.descricao());
        os.setTipoDesconto(dto.tipoDesconto() != null ? dto.tipoDesconto() : "N");
        os.setDesconto(dto.desconto());
        if (dto.statusServico() != null)
            os.setStatusServico(dto.statusServico());
        if (dto.valorPago() != null)
            os.setValorPago(dto.valorPago());
        os.setVeiculo(veiculo);

		if (dto.pecas() != null) {
			for (CreateOsDTO.ItemDTO item : dto.pecas()) {
				adicionarPecaItem(os, item.codItem(), item.nomeItem(), item.quantidade(), item.valorUnitario());
			}
		}

		if (dto.servicos() != null) {
			for (CreateOsDTO.ItemDTO item : dto.servicos()) {
				adicionarServicoItem(os, item.codItem(), item.nomeItem(), item.quantidade(), item.valorUnitario());
			}
		}

        OrdemServico salvo = repository.save(os);
        return new ResponseOsDTO(salvo, calcularValorTotal(salvo));
    }

    @Transactional
    public void deletar(Integer codOs) {
        if (!repository.existsById(codOs)) {
            throw new ResourceNotFoundException("Ordem de Serviço não encontrada com ID: " + codOs);
        }
        repository.deleteById(codOs);
    }

    public List<ResponseOsDTO> listarOsPorCliente(Long clienteId) {
        return repository.findByClienteIdAtivas(clienteId)
                .stream()
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)))
                .toList();
    }

    public Page<ResponseOsDTO> listarOsPorClientePaginado(Long clienteId, Pageable pageable) {
        return repository.findByClienteIdAtivasPaged(clienteId, pageable)
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)));
    }

    public Page<ResponseOsDTO> listarOsPorClienteEPlacaPaginado(Long clienteId, String placa, Pageable pageable) {
        var termos = ConsultaPorPlaca.obterTermosConsulta(placa);
        if (termos.termo1().isBlank()) {
            return listarOsPorClientePaginado(clienteId, pageable);
        }

        return repository.findByClienteIdAndVeiculoPlacaLikeAtivasPaged(clienteId, termos.termo1(), termos.termo2(), pageable)
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)));
    }

    public List<ResponseOsDTO> listarOsPorVeiculo(Integer veiculoId) {
        return repository.findByVeiculoIdAtivas(veiculoId)
                .stream()
                .map(os -> new ResponseOsDTO(os, calcularValorTotal(os)))
                .toList();
    }

    public Long contarOsPorVeiculo(Integer veiculoId) {
        return repository.countByVeiculoIdAtivas(veiculoId);
    }

	@Transactional
	public ResponseOsDTO atualizarOs(Integer codOs, UpdateOsDTO dto) {
		OrdemServico os = repository.findById(codOs)
				.orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço não encontrada com ID: " + codOs));

		if (dto.dataOs().isPresent()) {
			if (dto.dataOs().get() == null) {
				throw new BusinessValidationException("Data da OS é obrigatória.");
			}
			os.setDataOs(dto.dataOs().get());
		}

		dto.quilometragem().ifPresent(os::setQuilometragem);
		dto.descricao().ifPresent(os::setDescricao);

		if (dto.tipoDesconto().isPresent()) {
			String tipoDesconto = dto.tipoDesconto().get();
			if (tipoDesconto == null || tipoDesconto.isBlank()) {
				os.setTipoDesconto("N");
			} else {
				String normalizado = tipoDesconto.trim().toUpperCase();
				if (!List.of("N", "P", "V").contains(normalizado)) {
					throw new BusinessValidationException("Tipo de desconto inválido. Valores permitidos: 'N', 'P' ou 'V'.");
				}
				os.setTipoDesconto(normalizado);
			}
		}

		dto.desconto().ifPresent(os::setDesconto);

		if (dto.statusServico().isPresent()) {
			if (dto.statusServico().get() == null) {
				throw new BusinessValidationException("Status da OS é obrigatório.");
			}
			os.setStatusServico(dto.statusServico().get());
		}

		dto.valorPago().ifPresent(os::setValorPago);

		// Limpa os itens antigos (graças ao orphanRemoval = true, eles serão deletados)
		if (dto.pecas().isPresent()) {
			os.getPecas().clear();
			List<ItemUpdateDTO> pecas = dto.pecas().get();
			if (pecas != null) {
				for (ItemUpdateDTO item : pecas) {
					adicionarPecaItem(os, item.codItem(), item.nomeItem(), item.quantidade(), item.valorUnitario());
				}
			}
		}

		if (dto.servicos().isPresent()) {
			os.getServicos().clear();
			List<ItemUpdateDTO> servicos = dto.servicos().get();
			if (servicos != null) {
				for (ItemUpdateDTO item : servicos) {
					adicionarServicoItem(os, item.codItem(), item.nomeItem(), item.quantidade(), item.valorUnitario());
				}
			}
		}

		OrdemServico salvo = repository.save(os);
		return new ResponseOsDTO(salvo, calcularValorTotal(salvo));
	}

	private void adicionarPecaItem(OrdemServico os, Integer codItem, String nomeItem, Integer quantidade, BigDecimal valorUnitario) {
		Peca peca = null;
		if (codItem != null) {
			peca = pecaRepository.findById(codItem).orElse(null);
		}
		if (peca == null && nomeItem != null && !nomeItem.trim().isEmpty()) {
			peca = pecaRepository.findByNomePeca(nomeItem)
					.orElseGet(() -> {
						Peca nova = new Peca();
						nova.setNomePeca(nomeItem);
						return pecaRepository.save(nova);
					});
		}
		if (peca == null) {
			throw new ResourceNotFoundException("Peça inválida ou não informada.");
		}

		OsPeca osPeca = new OsPeca();
		osPeca.setPeca(peca);
		osPeca.setQuantidade(quantidade);
		osPeca.setValorUnitario(valorUnitario);
		os.adicionarPeca(osPeca);
	}

	private void adicionarServicoItem(OrdemServico os, Integer codItem, String nomeItem, Integer quantidade, BigDecimal valorUnitario) {
		Servico servico = null;
		if (codItem != null) {
			servico = servicoRepository.findById(codItem).orElse(null);
		}
		if (servico == null && nomeItem != null && !nomeItem.trim().isEmpty()) {
			servico = servicoRepository.findByNomeServico(nomeItem)
					.orElseGet(() -> {
						Servico novo = new Servico();
						novo.setNomeServico(nomeItem);
						return servicoRepository.save(novo);
					});
		}
		if (servico == null) {
			throw new ResourceNotFoundException("Serviço inválido ou não informado.");
		}

		OsServico osServico = new OsServico();
		osServico.setServico(servico);
		osServico.setQuantidade(quantidade);
		osServico.setValorUnitario(valorUnitario);
		os.adicionarServico(osServico);
	}

    public byte[] gerarPdfOs(Integer codOs) {
        OrdemServico os = repository.findById(codOs)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço não encontrada com ID: " + codOs));

        Map<String, Object> dadosOs = new HashMap<>();
        dadosOs.put("cod_os", os.getCodOs());
        dadosOs.put("data_os", os.getDataOs());
        dadosOs.put("quilometragem", os.getQuilometragem());
        dadosOs.put("descricao", os.getDescricao());
        dadosOs.put("status", os.getStatusServico());
        dadosOs.put("valor_pago", os.getValorPago());
        dadosOs.put("tipo_desconto", os.getTipoDesconto());
        dadosOs.put("desconto", os.getDesconto());

        Veiculo v = os.getVeiculo();
        dadosOs.put("placa", v.getPlaca());
        dadosOs.put("montadora", v.getModelo() != null ? v.getModelo().getMontadora().getNomeMontadora() : "");
        dadosOs.put("modelo", v.getModelo() != null ? v.getModelo().getNomeModelo() : "");
        dadosOs.put("cor", v.getCor());
        dadosOs.put("ano", String.valueOf(v.getAno()));
        dadosOs.put("combustivel", v.getCombustivel());

        Cliente c = v.getCliente();
        if (c != null) {
            dadosOs.put("nome_cliente", c.getNome());
            dadosOs.put("celular", c.getCelular());
            dadosOs.put("telefone", c.getTelefone());
            dadosOs.put("cpf_cnpj", c.getCpf_cnpj());
        } else {
            dadosOs.put("nome_cliente", "Sem dono ativo");
            dadosOs.put("celular", "");
            dadosOs.put("telefone", "");
            dadosOs.put("cpf_cnpj", "");
        }

        java.util.List<java.util.Map<String, Object>> itens = new java.util.ArrayList<>();
        for (OsPeca op : os.getPecas()) {
            java.util.Map<String, Object> i = new java.util.HashMap<>();
            i.put("nome_item", op.getPeca().getNomePeca());
            i.put("quantidade", op.getQuantidade());
            i.put("valor", op.getValorUnitario());
            i.put("tipo", "P");
            itens.add(i);
        }
        for (OsServico os_serv : os.getServicos()) {
            java.util.Map<String, Object> i = new java.util.HashMap<>();
            i.put("nome_item", os_serv.getServico().getNomeServico());
            i.put("quantidade", os_serv.getQuantidade());
            i.put("valor", os_serv.getValorUnitario());
            i.put("tipo", "S");
            itens.add(i);
        }
        dadosOs.put("itens", itens);

        return PdfOsService.gerarOsPdf(dadosOs);
    }
}
