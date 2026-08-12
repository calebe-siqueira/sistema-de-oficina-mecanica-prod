package com.carbulab.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.ordem_servico.OrdemServico;
import com.carbulab.domain.ordem_servico.OsPeca;
import com.carbulab.domain.ordem_servico.OsServico;
import com.carbulab.domain.veiculo.Veiculo;
import com.carbulab.dto.veiculo.CreateVeiculoDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDetailsDTO;
import com.carbulab.dto.veiculo.UpdateVeiculoDTO;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.DuplicateResourceException;
import com.carbulab.exception.PlacaConflictException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.ClienteRepository;
import com.carbulab.repositories.VeiculoRepository;
import com.carbulab.repositories.MontadoraRepository;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.repositories.ModeloRepository;
import com.carbulab.domain.veiculo.Montadora;
import com.carbulab.domain.veiculo.Carro;
import com.carbulab.domain.veiculo.Modelo;

import com.carbulab.utils.ConsultaPorPlaca;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VeiculoService {

	private final VeiculoRepository repository;
	private final ClienteRepository clienteRepository;
	private final MontadoraRepository montadoraRepository;
	private final ModeloRepository modeloRepository;
	private final OrdemServicoRepository ordemServicoRepository;
	private final JdbcTemplate jdbcTemplate;

	public VeiculoService(VeiculoRepository repository,
			ClienteRepository clienteRepository,
			MontadoraRepository montadoraRepository,
			ModeloRepository modeloRepository,
			OrdemServicoRepository ordemServicoRepository,
			JdbcTemplate jdbcTemplate) {
		this.repository = repository;
		this.clienteRepository = clienteRepository;
		this.montadoraRepository = montadoraRepository;
		this.modeloRepository = modeloRepository;
		this.ordemServicoRepository = ordemServicoRepository;
		this.jdbcTemplate = jdbcTemplate;
	}

	// ===================== RESTORE (LIXEIRA) =======================

	@Transactional
	public void restaurar(Integer id) {
		// Impede restaurar se o cliente superior estiver na lixeira
		String checkSql = "SELECT c.deleted_at FROM tb_veiculo v JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente WHERE v.cod_veiculo = ?";
		try {
			java.sql.Timestamp clienteDeletedAt = jdbcTemplate.queryForObject(checkSql, java.sql.Timestamp.class, id);
			if (clienteDeletedAt != null) {
				throw new BusinessValidationException("Não é possível restaurar este veículo pois o cliente ao qual ele pertence também está na lixeira. Restaure o cliente primeiro.");
			}
		} catch (EmptyResultDataAccessException e) {
			// Ignora se não houver resultado (não deveria acontecer por causa das constraints)
		}

		String sql = "SELECT deleted_at FROM tb_veiculo WHERE cod_veiculo = ?";
		java.sql.Timestamp ts = jdbcTemplate.queryForObject(sql, java.sql.Timestamp.class, id);
		java.time.LocalDateTime deletedAt = ts != null ? ts.toLocalDateTime() : java.time.LocalDateTime.now();

		repository.restoreVeiculo(id);
		
		ordemServicoRepository.restoreByVeiculoId(id, deletedAt);
		ordemServicoRepository.restorePecasByVeiculoId(id, deletedAt);
		ordemServicoRepository.restoreServicosByVeiculoId(id, deletedAt);
	}

	@Transactional
	public void deletarPermanentemente(Integer id) {
		try {
			int rows = repository.deletarPermanentemente(id);
			if (rows == 0) {
				throw new ResourceNotFoundException("Veículo não encontrado na lixeira para exclusão permanente.");
			}
		} catch (DataIntegrityViolationException e) {
			throw new BusinessValidationException("Não é possível excluir permanentemente este veículo, pois ele possui vínculos com outros dados do sistema.");
		}
	}

	public List<ResponseVeiculoDTO> listarLixeira() {
		return repository.findAllDeleted()
				.stream()
				.map(v -> {
					ResponseVeiculoDTO dto = new ResponseVeiculoDTO(v);
					if (v.getCliente() == null) {
						String sql = "SELECT c.cod_cliente, c.nome_cliente FROM tb_veiculo v JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente WHERE v.cod_veiculo = ?";
						try {
							Map<String, Object> map = jdbcTemplate.queryForMap(sql, v.getCod_veiculo());
							dto = new ResponseVeiculoDTO(
									dto.cod_veiculo(), dto.nomeMontadora(), dto.nomeModelo(), dto.ano(), dto.placa(), dto.cor(), dto.combustivel(), dto.tipo(),
									((Number) map.get("cod_cliente")).longValue(),
									(String) map.get("nome_cliente")
							);
						} catch (Exception e) {}
					}
					return dto;
				})
				.toList();
	}

	// ==============================================================

	private Modelo resolverModelo(String nomeMontadora, String nomeModelo) {
		Montadora montadora = montadoraRepository.findByNomeIgnorandoCaixa(nomeMontadora)
				.orElseGet(() -> {
					Montadora montadoraOrElseFind = new Montadora();
					montadoraOrElseFind.setNomeMontadora(nomeMontadora.toUpperCase());
					return montadoraRepository.save(montadoraOrElseFind);
				});

		return modeloRepository.findByNomeIgnorandoCaixaAndMontadora(nomeModelo, montadora.getCodMontadora())
				.orElseGet(() -> {
					Modelo modeloOrElseFind = new Modelo();
					modeloOrElseFind.setNomeModelo(nomeModelo.toUpperCase());
					modeloOrElseFind.setMontadora(montadora);
					return modeloRepository.save(modeloOrElseFind);
				});
	}

	public List<ResponseVeiculoDTO> listarTodos() {
		return repository.findAll()
				.stream()
				.map(ResponseVeiculoDTO::new)
				.toList();
	}

	public List<ResponseVeiculoDTO> listarComFiltroOs(List<Integer> status, LocalDate dataInicio, LocalDate dataFim) {
		StringBuilder sql = new StringBuilder(
			"SELECT DISTINCT v.cod_veiculo FROM tb_veiculo v " +
			"JOIN tb_ordem_servico os ON os.fk_cod_veiculo = v.cod_veiculo " +
			"WHERE v.deleted_at IS NULL AND os.deleted_at IS NULL "
		);
		List<Object> params = new ArrayList<>();

		if (status != null && !status.isEmpty() && !status.contains(0)) {
			sql.append(" AND os.status_servico IN (");
			sql.append(status.stream().map(s -> "?").collect(Collectors.joining(",")));
			sql.append(") ");
			params.addAll(status);
		}
		if (dataInicio != null) {
			sql.append(" AND os.data_os >= ? ");
			params.add(java.sql.Date.valueOf(dataInicio));
		}
		if (dataFim != null) {
			sql.append(" AND os.data_os <= ? ");
			params.add(java.sql.Date.valueOf(dataFim));
		}

		List<Integer> ids = jdbcTemplate.queryForList(sql.toString(), Integer.class, params.toArray());

		if (ids.isEmpty()) {
			return new ArrayList<>();
		}

		return repository.findAllById(ids).stream()
				.map(ResponseVeiculoDTO::new)
				.toList();
	}

	public ResponseVeiculoDTO buscarPorId(Integer id) {
		return repository.findById(id)
				.map(ResponseVeiculoDTO::new)
				.orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + id));
	}

	public ResponseVeiculoDetailsDTO buscarDetalhesPorId(Integer id) {
		Veiculo veiculo = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + id));
		return new ResponseVeiculoDetailsDTO(veiculo, veiculo.getCliente());
	}

	public ResponseVeiculoDTO buscarPorPlaca(String placa) {
		String placaLimpa = placa.replaceAll("[-]", "").toUpperCase();
		String placaMercosul = ConsultaPorPlaca.adaptaPlacaParaFormatoInverso_MercosulAntigo(placaLimpa);
		List<String> placas = placaMercosul != null ? List.of(placaLimpa, placaMercosul) : List.of(placaLimpa);

		List<Veiculo> veiculos = repository.findByPlacaInAndDeletedAtIsNull(placas);
		if (veiculos.isEmpty()) {
			throw new ResourceNotFoundException("Veículo não encontrado com placa: " + placa);
		}
		return new ResponseVeiculoDTO(veiculos.get(0));
	}

	public List<ResponseVeiculoDTO> listarVeiculosPorCliente(Long clienteId) {
		if (!clienteRepository.existsById(clienteId)) {
			throw new ResourceNotFoundException("Cliente não encontrado com ID: " + clienteId);
		}
		return repository.findByClienteIdAtivo(clienteId)
				.stream()
				.map(ResponseVeiculoDTO::new)
				.toList();
	}

	@Transactional
	public ResponseVeiculoDTO criar(CreateVeiculoDTO dto, boolean force) {
		String placaLimpa = dto.placa().replaceAll("[-]", "").toUpperCase();
		String placaMercosul = ConsultaPorPlaca.adaptaPlacaParaFormatoInverso_MercosulAntigo(placaLimpa);
		List<String> placas = placaMercosul != null ? List.of(placaLimpa, placaMercosul) : List.of(placaLimpa);

		List<Veiculo> veiculosExistentes = repository.findByPlacaInAndDeletedAtIsNull(placas);

		Cliente cliente = clienteRepository.findById(dto.fk_cod_cliente())
				.orElseThrow(
						() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + dto.fk_cod_cliente()));

		// Validação da placa
		boolean existeParaOutroCliente = false;
		List<Map<String, Object>> donosAntigos = new ArrayList<>();
		for (Veiculo v : veiculosExistentes) {
			if (v.getCliente().getCod_cliente() == cliente.getCod_cliente()) {
				throw new DuplicateResourceException(
					"Veículo não salvo. \nJá existe um veículo cadastrado com essa placa para o cliente atual");
			} else {
				existeParaOutroCliente = true;
				Map<String, Object> map = new HashMap<>();
				map.put("cod_cliente", v.getCliente().getCod_cliente());
				map.put("nome_cliente", v.getCliente().getNome());
				map.put("cpf_cnpj", v.getCliente().getCpf_cnpj());
				donosAntigos.add(map);
			}
		}

		if (existeParaOutroCliente && !force) {
			// Erro lançado ao tentar criar um novo veículo cuja placa já existe para outro cliente
			throw new PlacaConflictException(gerarMensagemListandoDonosAntigos(donosAntigos), donosAntigos);
		} 

		// Cria um novo veículo
		Veiculo veiculoASalvar = new Carro();
		Modelo modelo = resolverModelo(dto.nomeMontadora(), dto.nomeModelo());
		veiculoASalvar.setModelo(modelo);
		veiculoASalvar.setAno(dto.ano());
		veiculoASalvar.setPlaca(placaLimpa);
		veiculoASalvar.setCor(dto.cor());
		veiculoASalvar.setCombustivel(dto.combustivel());
		veiculoASalvar.setCliente(cliente);

		veiculoASalvar = repository.save(veiculoASalvar);

		return new ResponseVeiculoDTO(veiculoASalvar);
	}

	@Transactional
	public ResponseVeiculoDTO atualizar(Integer id, UpdateVeiculoDTO dto, boolean force) {
		Veiculo veiculo = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + id));

		if (dto.nomeMontadora() != null || dto.nomeModelo() != null) {
			String mMontadora = dto.nomeMontadora() != null ? dto.nomeMontadora()
					: (veiculo.getModelo() != null ? veiculo.getModelo().getMontadora().getNomeMontadora() : "");
			String mModelo = dto.nomeModelo() != null ? dto.nomeModelo()
					: (veiculo.getModelo() != null ? veiculo.getModelo().getNomeModelo() : "");
			veiculo.setModelo(resolverModelo(mMontadora, mModelo));
		}
		if (dto.ano() != null)
			veiculo.setAno(dto.ano());
		if (dto.cor() != null)
			veiculo.setCor(dto.cor());
		if (dto.combustivel() != null)
			veiculo.setCombustivel(dto.combustivel());

		if (dto.placa() != null) {
			String placaLimpa = dto.placa().replaceAll("[-]", "").toUpperCase();
			if (!placaLimpa.equals(veiculo.getPlaca())) {
				String placaMercosul = ConsultaPorPlaca.adaptaPlacaParaFormatoInverso_MercosulAntigo(placaLimpa);
				List<String> placas = placaMercosul != null ? List.of(placaLimpa, placaMercosul) : List.of(placaLimpa);

				List<Veiculo> veiculosExistentes = repository.findByPlacaInAndDeletedAtIsNull(placas);
				
				// Validação da placa
				boolean existeParaOutroCliente = false;
				List<Map<String, Object>> donosAntigos = new ArrayList<>();
				for (Veiculo v : veiculosExistentes) {
					if (v.getCod_veiculo() != veiculo.getCod_veiculo()) {
						if (v.getCliente().getCod_cliente() == veiculo.getCliente().getCod_cliente()) {
							throw new DuplicateResourceException(
								"Veículo não salvo. \nJá existe um veículo cadastrado com essa placa para o cliente atual");
						} else {
							existeParaOutroCliente = true;
							Map<String, Object> map = new HashMap<>();
							map.put("cod_cliente", v.getCliente().getCod_cliente());
							map.put("nome_cliente", v.getCliente().getNome());
							map.put("cpf_cnpj", v.getCliente().getCpf_cnpj());
							donosAntigos.add(map);
						}
					}
				}

				if (existeParaOutroCliente && !force) {
					// Erro lançado ao tentar criar um novo veículo cuja placa já existe para outro cliente
					throw new PlacaConflictException(gerarMensagemListandoDonosAntigos(donosAntigos), donosAntigos);
				} 

				veiculo.setPlaca(placaLimpa);
			}
		}

		Veiculo salvo = repository.save(veiculo);
		return new ResponseVeiculoDTO(salvo);
	}

	@Transactional
	public void deletar(Integer id) {
		if (!repository.existsById(id)) {
			throw new ResourceNotFoundException("Veículo não encontrado com ID: " + id);
		}
		repository.deleteById(id);

		// Soft Delete Cascade para Ordens de Serviço
		String sqlCascadeOS = "UPDATE tb_ordem_servico SET deleted_at = CURRENT_TIMESTAMP WHERE fk_cod_veiculo = ? AND deleted_at IS NULL";
		jdbcTemplate.update(sqlCascadeOS, id);
	}

	public byte[] gerarPdfHistoricoVeiculo(Integer id, List<Integer> status, LocalDate dataInicio,
			LocalDate dataFim, PdfRelVeiculoService pdfRelVeiculoService,
			OrdemServicoRepository osRepo) {
		Veiculo veiculo = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Veículo não encontrado com ID: " + id));

		Map<String, Object> dadosRelatorio = new HashMap<>();

		// 1. Dados do Veículo e Cliente
		Map<String, Object> dados = new HashMap<>();
		dados.put("placa", veiculo.getPlaca());
		dados.put("montadora",
				veiculo.getModelo() != null && veiculo.getModelo().getMontadora() != null
						? veiculo.getModelo().getMontadora().getNomeMontadora()
						: "");
		dados.put("modelo", veiculo.getModelo() != null ? veiculo.getModelo().getNomeModelo() : "");
		dados.put("cor", veiculo.getCor());
		dados.put("ano", String.valueOf(veiculo.getAno()));
		dados.put("combustivel", veiculo.getCombustivel());

		Cliente c = veiculo.getCliente();
		if (c != null) {
			dados.put("nome_cliente", c.getNome());
			dados.put("celular", c.getCelular());
			dados.put("telefone", c.getTelefone());
			dados.put("cpf_cnpj", c.getCpf_cnpj());
		} else {
			dados.put("nome_cliente", "Sem dono ativo");
			dados.put("celular", "");
			dados.put("telefone", "");
			dados.put("cpf_cnpj", "");
		}

		dadosRelatorio.put("dados", dados);

		// 2. Filtrar OS ativas do Veiculo (e filtrar manualmente por data e status)
		// OBS: Para simplificar, farei em memória, pois os filtros são dinâmicos.
		// Em um sistema real poderíamos usar Specifications do Spring Data.
		List<OrdemServico> todasOs = osRepo.findByVeiculoIdAtivas(id);

		List<Map<String, Object>> ordensMapeadas = new ArrayList<>();
		for (OrdemServico os : todasOs) {
			// Filtro de status
			if (status != null && !status.isEmpty() && !status.contains(0)) {
				if (!status.contains(os.getStatusServico()))
					continue;
			}
			// Filtro de data inicial
			if (dataInicio != null && os.getDataOs().isBefore(dataInicio))
				continue;
			// Filtro de data final
			if (dataFim != null && os.getDataOs().isAfter(dataFim))
				continue;

			Map<String, Object> osMap = new HashMap<>();
			osMap.put("cod_os", os.getCodOs());
			osMap.put("data_os", os.getDataOs());
			osMap.put("quilometragem", os.getQuilometragem());
			osMap.put("descricao", os.getDescricao());
			osMap.put("status_servico", os.getStatusServico());
			osMap.put("tipo_desconto", os.getTipoDesconto());
			osMap.put("desconto", os.getDesconto());
			osMap.put("valor_pago", os.getValorPago());

			List<Map<String, Object>> itens = new ArrayList<>();
			for (OsPeca op : os.getPecas()) {
				Map<String, Object> i = new HashMap<>();
				i.put("nome_item", op.getPeca().getNomePeca());
				i.put("quantidade", op.getQuantidade());
				i.put("valor", op.getValorUnitario());
				i.put("tipo", "P");
				itens.add(i);
			}
			for (OsServico osServ : os.getServicos()) {
				Map<String, Object> i = new HashMap<>();
				i.put("nome_item", osServ.getServico().getNomeServico());
				i.put("quantidade", osServ.getQuantidade());
				i.put("valor", osServ.getValorUnitario());
				i.put("tipo", "S");
				itens.add(i);
			}
			osMap.put("itens", itens);
			ordensMapeadas.add(osMap);
		}

		if (ordensMapeadas.isEmpty()) {
			throw new ResourceNotFoundException("Nenhuma ordem de serviço encontrada para os filtros especificados");
		}

		dadosRelatorio.put("ordens", ordensMapeadas);

		return pdfRelVeiculoService.gerarRelatorioOsPorVeiculo(dadosRelatorio);
	}

	private String gerarMensagemListandoDonosAntigos(java.util.List<java.util.Map<String, Object>> donosAntigos) {
		// Mensagem de erro lançada ao tentar criar um novo veículo cuja placa já existe para outro cliente
		return donosAntigos.size() == 1
			? "Já existe um veículo cadastrado com essa placa para outro cliente (Nome: " +
				donosAntigos.get(0).get("nome_cliente").toString().toUpperCase() + "). Deseja prosseguir?"
			: String.format(
				"Já existem veículos cadastrados com essa placa para outros %d clientes:\n\n%s.\n\nDeseja prosseguir?",
				donosAntigos.size(),
				donosAntigos.stream()
					.map(donoAntigo -> String.format("- %s",
							donoAntigo.get("nome_cliente").toString().toUpperCase()))
					.collect(Collectors.joining(",\n")));
	}
}