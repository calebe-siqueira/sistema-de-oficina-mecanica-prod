package com.carbulab.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

import com.carbulab.domain.Pessoa;
import com.carbulab.domain.cliente.Cep;
import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.cliente.Endereco;

import com.carbulab.dto.cliente.CreateClienteDTO;
import com.carbulab.dto.cliente.ResponseClienteDTO;
import com.carbulab.dto.cliente.ResponseEnderecoDTO;
import com.carbulab.dto.cliente.ResponseMeuPerfilDTO;
import com.carbulab.dto.cliente.SearchClienteDTO;
import com.carbulab.dto.cliente.UpdateClienteDTO;
import com.carbulab.dto.cliente.CreateClienteDTO.EnderecoDTO;
import com.carbulab.dto.common.PatchField;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;
import com.carbulab.utils.ConsultaPorPlaca;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.CepRepository;
import com.carbulab.repositories.ClienteQueryRepository;
import com.carbulab.repositories.ClienteRepository;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.repositories.PessoaRepository;
import com.carbulab.repositories.UsuarioRepository;
import com.carbulab.repositories.VeiculoRepository;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.DuplicateResourceException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service para CLIENTE
 * 
 * Centraliza toda a lógica de negócio relacionada a clientes:
 * - Validações
 * - Transformações de dados
 * - Coordenação de operações
 * - Garantias transacionais
 */

@Service
public class ClienteService {

	private final ClienteRepository repository;
	private final ClienteQueryRepository queryRepository;
	private final JdbcTemplate jdbcTemplate;
	private final VeiculoRepository veiculoRepository;
	private final OrdemServicoRepository ordemServicoRepository;
	private final PessoaRepository pessoaRepository;
	private final UsuarioRepository usuarioRepository;
	private final CepRepository cepRepository;

	public ClienteService(ClienteRepository repository,
						  ClienteQueryRepository queryRepository,
						  JdbcTemplate jdbcTemplate,
						  VeiculoRepository veiculoRepository,
						  OrdemServicoRepository ordemServicoRepository,
						  PessoaRepository pessoaRepository,
						  UsuarioRepository usuarioRepository,
						  CepRepository cepRepository) {
		this.repository = repository;
		this.queryRepository = queryRepository;
		this.jdbcTemplate = jdbcTemplate;
		this.veiculoRepository = veiculoRepository;
		this.ordemServicoRepository = ordemServicoRepository;
		this.pessoaRepository = pessoaRepository;
		this.usuarioRepository = usuarioRepository;
		this.cepRepository = cepRepository;
	}

	// ===================== RESTORE (LIXEIRA) =======================

	@Transactional
	public void restaurar(Long id) {
		String sql = "SELECT deleted_at FROM tb_cliente WHERE cod_cliente = ?";
		Timestamp ts = jdbcTemplate.queryForObject(sql, java.sql.Timestamp.class, id);
		LocalDateTime deletedAt = ts != null ? ts.toLocalDateTime() : LocalDateTime.now();

		repository.restoreCliente(id);
		repository.restoreEnderecoByCliente(id, deletedAt);
		
		veiculoRepository.restoreByClienteId(id, deletedAt);
		
		ordemServicoRepository.restoreByClienteId(id, deletedAt);
		ordemServicoRepository.restorePecasByClienteId(id, deletedAt);
		ordemServicoRepository.restoreServicosByClienteId(id, deletedAt);

		// Restaura tb_usuario vinculado ao cliente (se foi excluído junto com o cliente)
		String sqlRestoreUsuario = "UPDATE tb_usuario SET deleted_at = NULL WHERE (fk_cod_cliente = ? OR (fk_cod_pessoa = (SELECT fk_cod_pessoa FROM tb_cliente WHERE cod_cliente = ?) AND funcao = 'CLIENTE')) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, ?)) <= 5";
		jdbcTemplate.update(sqlRestoreUsuario, id, id, Timestamp.valueOf(deletedAt));

		// Restaura tb_pessoa vinculada ao cliente (se foi excluída junto com o cliente)
		String sqlRestorePessoa = "UPDATE tb_pessoa SET deleted_at = NULL WHERE cod_pessoa = (SELECT fk_cod_pessoa FROM tb_cliente WHERE cod_cliente = ?) AND deleted_at IS NOT NULL AND ABS(TIMESTAMPDIFF(SECOND, deleted_at, ?)) <= 5";
		jdbcTemplate.update(sqlRestorePessoa, id, Timestamp.valueOf(deletedAt));
	}

	@Transactional
	public void deletarPermanentemente(Long id) {
		try {
			// Remove usuário vinculado na lixeira antes de excluir o cliente, evitando restrição de FK
			String sqlDeleteUsuario = "DELETE FROM tb_usuario WHERE (fk_cod_cliente = ? OR (fk_cod_pessoa = (SELECT fk_cod_pessoa FROM tb_cliente WHERE cod_cliente = ?) AND funcao = 'CLIENTE')) AND deleted_at IS NOT NULL";
			jdbcTemplate.update(sqlDeleteUsuario, id, id);

			Long codPessoa = null;
			Long codEndereco = null;
			try {
				codPessoa = jdbcTemplate.queryForObject("SELECT fk_cod_pessoa FROM tb_cliente WHERE cod_cliente = ?", Long.class, id);
				codEndereco = jdbcTemplate.queryForObject("SELECT fk_cod_endereco FROM tb_cliente WHERE cod_cliente = ?", Long.class, id);
			} catch (Exception ignored) {}

			int rows = repository.deletarPermanentemente(id);
			if (rows == 0) {
				throw new ResourceNotFoundException("Cliente não encontrado na lixeira para exclusão permanente.");
			}

			// Se a pessoa na lixeira não estiver vinculada a mais nenhum outro cliente ou usuário, remove permanentemente
			if (codPessoa != null) {
				String sqlCheckPessoa = "SELECT COUNT(*) FROM (SELECT fk_cod_pessoa FROM tb_cliente WHERE fk_cod_pessoa = ? UNION ALL SELECT fk_cod_pessoa FROM tb_usuario WHERE fk_cod_pessoa = ?) AS t";
				Integer countPessoa = jdbcTemplate.queryForObject(sqlCheckPessoa, Integer.class, codPessoa, codPessoa);
				if (countPessoa != null && countPessoa == 0) {
					jdbcTemplate.update("DELETE FROM tb_pessoa WHERE cod_pessoa = ? AND deleted_at IS NOT NULL", codPessoa);
				}
			}

			// Se o endereço na lixeira não estiver vinculado a outro cliente, remove permanentemente
			if (codEndereco != null) {
				String sqlCheckEndereco = "SELECT COUNT(*) FROM tb_cliente WHERE fk_cod_endereco = ?";
				Integer countEndereco = jdbcTemplate.queryForObject(sqlCheckEndereco, Integer.class, codEndereco);
				if (countEndereco != null && countEndereco == 0) {
					jdbcTemplate.update("DELETE FROM tb_endereco WHERE cod_endereco = ? AND deleted_at IS NOT NULL", codEndereco);
				}
			}
		} catch (DataIntegrityViolationException e) {
			throw new BusinessValidationException("Não é possível excluir permanentemente este cliente, pois ele possui vínculos com outros dados do sistema.");
		}
	}

	public Page<ResponseClienteDTO> listarLixeira(Pageable pageable) {
		return repository.findAllDeleted(pageable)
				.map(ResponseClienteDTO::new);
	}

	// ===================== LISTAR =======================

	/**
	 * Buscar todos os clientes
	 */
	public Page<ResponseClienteDTO> listarTodos(Pageable pageable) {
		return repository.findAll(pageable)
				.map(ResponseClienteDTO::new);
	}

	// ===================== BUSCAR =======================

	/**
	 * Buscar cliente por ID (básico)
	 */
	public ResponseClienteDTO buscarPorId(Long id) {
		return repository.findById(id)
				.map(ResponseClienteDTO::new)
				.orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));
	}

	/**
	 * Buscar cliente com dados relacionados (endereço e/ou veículos)
	 * 
	 * @param id              Cliente ID
	 * @param includeEndereco Se true, carrega endereço
	 * @param includeVeiculos Se true, carrega veículos
	 * @return ClienteResponseDTO com dados opcionais
	 */
	public ResponseClienteDTO buscarPorIdCompleto(Long id, boolean includeEndereco, boolean includeVeiculos) {
		Cliente cliente = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

		ResponseEnderecoDTO endereco = null;
		List<ResponseVeiculoDTO> veiculos = null;
		if (includeEndereco && cliente.getFk_cod_endereco() != null) {
			endereco = carregarEnderecoDTO(cliente.getFk_cod_endereco());
		}

		if (includeVeiculos) {
			veiculos = carregarVeiculosDTO(id);
		}

		return new ResponseClienteDTO(cliente, endereco, veiculos);
	}

	/**
	 * Buscar dados do perfil do cliente (dados cadastrais + endereço, sem veículos)
	 */
	public ResponseMeuPerfilDTO buscarMeuPerfil(Long id) {
		Cliente cliente = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

		ResponseEnderecoDTO endereco = null;
		if (cliente.getFk_cod_endereco() != null) {
			endereco = carregarEnderecoDTO(cliente.getFk_cod_endereco());
		}

		return new ResponseMeuPerfilDTO(cliente, endereco);
	}

	/**
	 * Busca com filtros dinâmicos
	 * Tipos suportados: "nome", "cpf_cnpj", "telefone", "placa"
	 */
	public Page<Map<String, Object>> buscar(SearchClienteDTO search, Pageable pageable) {
		if (search.termo() == null || search.termo().isBlank()) {
			return Page.empty();
		}

		String termo = search.termo().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();

		return switch (search.tipo()) {
			// Utiliza o repositório de queries customizadas para buscas complexas (uma vez
			// que as buscas por nome, CPF/CNPJ, telefone e placa exigem manipulações
			// específicas, que não são geradas automaticamente pelo Spring Data JPA)
			case "cod_cliente" -> {
				try {
					yield queryRepository.buscarPorId(Long.parseLong(termo), pageable);
				} catch (NumberFormatException e) {
					yield Page.empty();
				}
			}
			case "nome" -> queryRepository.buscarPorNome(search.termo(), pageable);
			case "cpf_cnpj" -> queryRepository.buscarPorCpfCnpj(termo, pageable);
			case "telefone" -> queryRepository.buscarPorTelefone(termo, pageable);
			case "placa" -> {
				var termos = ConsultaPorPlaca.obterTermosConsulta(termo);
				Page<Map<String, Object>> resultado = queryRepository.buscarPorPlaca("%" + termos.termo1() + "%", pageable);
				if ((resultado == null || resultado.isEmpty()) && termos.possuiConversao()) {
					resultado = queryRepository.buscarPorPlaca("%" + termos.termo2() + "%", pageable);
				}
				yield resultado != null ? resultado : Page.empty();
			}
			default -> throw new BusinessValidationException("Tipo de busca inválido: " + search.tipo());
		};
	}

	// ===================== CRIAR =======================

	/**
	 * Criar novo cliente com validações
	 */
	@Transactional
	public ResponseClienteDTO criar(CreateClienteDTO dto) {
		// Valida os dados do cliente:
		validarDadosCliente(dto);

		validarUnicidadeCpfCnpj(dto.cpf_cnpj(), null);
		validarUnicidadeEmail(dto.email(), null);

		// 1. Criar entidade Cliente
		Cliente novoCliente = new Cliente();
		novoCliente.setPessoa(new Pessoa(dto.nome_cliente(), dto.email()));
		novoCliente.setCelular(dto.celular());
		novoCliente.setTelefone(dto.telefone());
		novoCliente.setRg(dto.rg());
		novoCliente.setCpf_cnpj(dto.cpf_cnpj());
		novoCliente.setNascimento(dto.data_nascimento());
		novoCliente.setTipo(dto.tipo());

		// 2. Mapear endereço do DTO (se ele existir e não estiver vazio)
		if (dto.endereco() != null && !isEnderecoEmpty(dto.endereco())) {
			Cep dadosCep = resolverOuCriarCep(
					dto.endereco().cep(),
					dto.endereco().uf(),
					dto.endereco().cidade(),
					dto.endereco().bairro(),
					dto.endereco().logradouro());

			if (dadosCep == null) {
				throw new BusinessValidationException("CEP é obrigatório para o endereço.");
			}

			// Endereço completo
			Endereco endereco = new Endereco();
			// Campos da tb_endereco
			endereco.setNumero(dto.endereco().numero());
			endereco.setComplemento(dto.endereco().complemento());
			endereco.setCep(dadosCep);

			// Vincula o endereço completo ao cliente
			novoCliente.setEndereco(endereco);
		}

		// Salvar e retornar como DTO (salva o cliente no banco de dados)
		Cliente salvo = repository.save(novoCliente);
		return new ResponseClienteDTO(salvo);
	}

	// ===================== ATUALIZAR =======================

	/**
	 * Atualizar cliente existente (suporta atualização parcial com distinção entre campo omitido e {@code null} explícito)
	 */
	@Transactional
	public ResponseClienteDTO atualizar(Long id, UpdateClienteDTO dto) {
		Cliente cliente = repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + id));

		if (dto.nome_cliente().isPresent()) {
			String novoNome = dto.nome_cliente().get();
			if (novoNome == null || novoNome.isBlank()) {
				throw new BusinessValidationException("Nome é obrigatório");
			}
			cliente.setNome(novoNome);
		}

		if (dto.cpf_cnpj().isPresent()) {
			String novoCpfCnpj = dto.cpf_cnpj().get();
			validarUnicidadeCpfCnpj(novoCpfCnpj, cliente.getCodCliente());
			cliente.setCpf_cnpj(novoCpfCnpj);
		}

		if (dto.email().isPresent()) {
			String novoEmail = dto.email().get();
			if (novoEmail != null && !novoEmail.isBlank()) {
				Long codPessoa = cliente.getPessoa() != null ? cliente.getPessoa().getCodPessoa() : null;
				validarUnicidadeEmail(novoEmail, codPessoa);
				cliente.setEmail(novoEmail);
			} else {
				if (possuiAcessoAtivo(id)) {
					throw new BusinessValidationException(
							"Não é possível remover o e-mail de um cliente que possui acesso ativo ao sistema.");
				}
				cliente.setEmail(null);
			}
		}

		dto.celular().ifPresent(cliente::setCelular);
		dto.telefone().ifPresent(cliente::setTelefone);
		dto.rg().ifPresent(cliente::setRg);
		dto.data_nascimento().ifPresent(cliente::setNascimento);

		if (dto.tipo().isPresent()) {
			Character novoTipo = dto.tipo().get();
			if (novoTipo == null || (novoTipo != 'F' && novoTipo != 'J')) {
				throw new BusinessValidationException("Tipo de cliente inválido. Valores permitidos: 'F' ou 'J'.");
			}
			cliente.setTipo(novoTipo);
		}

		// Atualizar o bloco de endereço apenas se ele estiver presente na requisição
		if (dto.endereco().isPresent()) {
			atualizarEndereco(cliente, dto.endereco().get());
		}

		// Salvar e retornar como DTO
		Cliente atualizado = repository.save(cliente);
		return new ResponseClienteDTO(atualizado);
	}

	// ===================== DELETAR =======================

	/**
	 * Deletar cliente por ID (soft-delete com cascata para veículos, OS, usuário e pessoa)
	 */
	@Transactional
	public void deletar(Long id) {
		if (!repository.existsById(id)) {
			throw new ResourceNotFoundException("Cliente não encontrado com ID: " + id);
		}
		repository.deleteById(id);

		// Soft Delete Cascade para Veículos e suas Ordens de Serviço
		String sqlCascadeOS = "UPDATE tb_ordem_servico SET deleted_at = CURRENT_TIMESTAMP WHERE fk_cod_veiculo IN (SELECT cod_veiculo FROM tb_veiculo WHERE fk_cod_cliente = ?) AND deleted_at IS NULL";
		jdbcTemplate.update(sqlCascadeOS, id);

		String sqlCascadeVeiculo = "UPDATE tb_veiculo SET deleted_at = CURRENT_TIMESTAMP WHERE fk_cod_cliente = ? AND deleted_at IS NULL";
		jdbcTemplate.update(sqlCascadeVeiculo, id);

		// Soft Delete Cascade para Usuário vinculado ao Cliente
		// Usa o mecanismo JPA (@SQLDelete) para garantir consistência com o soft-delete da entidade Usuario
		usuarioRepository.findByClienteId(id).ifPresent(usuarioRepository::delete);

		// Soft Delete Cascade para Pessoa vinculada ao Cliente
		String sqlCascadePessoa = "UPDATE tb_pessoa SET deleted_at = CURRENT_TIMESTAMP WHERE cod_pessoa = (SELECT fk_cod_pessoa FROM tb_cliente WHERE cod_cliente = ?) AND deleted_at IS NULL";
		jdbcTemplate.update(sqlCascadePessoa, id);
	}

	// ===================== MÉTODOS PRIVADOS =======================

	/**
	 * Carregar endereço do banco
	 */
	private ResponseEnderecoDTO carregarEnderecoDTO(Long codEndereco) {
		try {
			// Tenta carregar com todas as colunas possíveis
			String sql = "SELECT e.*, c.* FROM tb_endereco AS e INNER JOIN tb_cep AS c ON e.fk_cod_cep = c.cod_cep WHERE cod_endereco = ?";
			var map = jdbcTemplate.queryForMap(sql, codEndereco);

			Integer numero = map.get("numero") != null ? Integer.valueOf(map.get("numero").toString()) : null;

			return new ResponseEnderecoDTO(
					((Number) map.get("cod_endereco")).longValue(),
					(long) ((Number) map.get("fk_cod_cep")).longValue(),
					(Integer) numero,
					(String) map.get("complemento"),
					(String) map.get("cep"),
					(String) map.get("uf"),
					(String) map.get("bairro"),
					(String) map.get("cidade"),
					(String) map.get("logradouro"));
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	/**
	 * Carregar veículos do cliente
	 */
	private List<ResponseVeiculoDTO> carregarVeiculosDTO(Long clienteId) {
		try {
			// Após unificação: nome_cliente migrou para tb_pessoa.nome
			String sql = "SELECT v.cod_veiculo, mo.nome_montadora as montadora, m.nome_modelo as modelo, v.ano, v.placa, v.cor, v.combustivel, v.tipo, v.fk_cod_cliente, p.nome as nome_cliente " +
					"FROM tb_veiculo v " +
					"JOIN tb_modelo m ON v.fk_cod_modelo = m.cod_modelo " +
					"JOIN tb_montadora mo ON m.fk_cod_montadora = mo.cod_montadora " +
					"LEFT JOIN tb_cliente c ON v.fk_cod_cliente = c.cod_cliente " +
					"LEFT JOIN tb_pessoa p ON c.fk_cod_pessoa = p.cod_pessoa " +
					"WHERE v.fk_cod_cliente = ? AND v.deleted_at IS NULL ORDER BY v.cod_veiculo DESC";

			return jdbcTemplate.query(sql, (rs, rowNum) -> new ResponseVeiculoDTO(
					rs.getLong("cod_veiculo"),
					rs.getString("montadora"),
					rs.getString("modelo"),
					rs.getInt("ano"),
					rs.getString("placa"),
					rs.getString("cor"),
					rs.getString("combustivel"),
					rs.getString("tipo"),
					rs.getLong("fk_cod_cliente"),
					rs.getString("nome_cliente")), clienteId);
		} catch (Exception e) {
			return List.of();
		}
	}

	/**
	 * Validar dados do cliente
	 */
	private void validarDadosCliente(CreateClienteDTO dto) {
		// Valida nome (obrigatório)
		if (dto.nome_cliente() == null || dto.nome_cliente().isBlank()) {
			throw new BusinessValidationException("Nome é obrigatório");
		}

		// if (dto.cpf_cnpj() == null || dto.cpf_cnpj().isBlank()) {
		// throw new BusinessValidationException("CPF/CNPJ é obrigatório");
		// }

		// if (dto.tipo() == 'F' && (dto.nascimento() == null)) {
		// throw new BusinessValidationException("Data de nascimento é obrigatória para
		// pessoa física");
		// }
	}

	/**
	 * Verifica se o DTO de endereço está vazio
	 */
	private boolean isEnderecoEmpty(EnderecoDTO dto) {
		return (dto.cep() == null || dto.cep().isBlank()) &&
				(dto.logradouro() == null || dto.logradouro().isBlank()) &&
				(dto.bairro() == null || dto.bairro().isBlank()) &&
				(dto.cidade() == null || dto.cidade().isBlank()) &&
				(dto.uf() == null || dto.uf().isBlank()) &&
				(dto.complemento() == null || dto.complemento().isBlank()) &&
				dto.numero() == null;
	}

	private void validarUnicidadeCpfCnpj(String cpfCnpj, Long excludeClienteId) {
		if (cpfCnpj == null || cpfCnpj.isBlank()) {
			return;
		}
		String cpfCnpjClean = cpfCnpj.replaceAll("[^0-9]", "");
		if (cpfCnpjClean.isBlank()) {
			return;
		}
		queryRepository.findByCpfCnpjClean(cpfCnpjClean).ifPresent(clienteExistente -> {
			if (excludeClienteId == null || clienteExistente.getCodCliente() != excludeClienteId) {
				throw new DuplicateResourceException(
						String.format("Já existe um cliente cadastrado com esse CPF/CNPJ (Nome: %s).",
								clienteExistente.getNome()));
			}
		});
	}

	private void validarUnicidadeEmail(String email, Long excludePessoaId) {
		if (email == null || email.isBlank()) {
			return;
		}
		String emailNormalizado = email.trim().toLowerCase();
		boolean duplicado = excludePessoaId == null
				? pessoaRepository.existsByEmailIgnoreCase(emailNormalizado)
				: pessoaRepository.existsByEmailIgnoreCaseAndCodPessoaNot(emailNormalizado, excludePessoaId);
		if (duplicado) {
			throw new DuplicateResourceException("Já existe um cliente ou usuário cadastrado com esse e-mail.");
		}
	}

	private boolean possuiAcessoAtivo(Long clienteId) {
		return usuarioRepository.findByClienteId(clienteId)
				.filter(u -> u.getDeletedAt() == null)
				.isPresent();
	}

	private Cep resolverOuCriarCep(String cepRaw, String uf, String cidade, String bairro, String logradouro) {
		String cepLimpo = cepRaw != null ? cepRaw.replaceAll("[^0-9]", "") : null;
		if (cepLimpo == null || cepLimpo.isBlank()) {
			return null;
		}
		return cepRepository.findByCep(cepLimpo).orElseGet(() -> {
			Cep novo = new Cep();
			novo.setCep(cepLimpo);
			novo.setUf(uf);
			novo.setCidade(cidade);
			novo.setBairro(bairro);
			novo.setLogradouro(logradouro);
			return novo;
		});
	}

	private void atualizarEndereco(Cliente cliente, UpdateClienteDTO.EnderecoDTO enderecoDto) {
		if (enderecoDto == null) {
			cliente.setEndereco(null);
			return;
		}

		boolean todosPresentesVazios = isBlankOrNullIfPresent(enderecoDto.cep())
				&& isBlankOrNullIfPresent(enderecoDto.logradouro())
				&& isBlankOrNullIfPresent(enderecoDto.bairro())
				&& isBlankOrNullIfPresent(enderecoDto.cidade())
				&& isBlankOrNullIfPresent(enderecoDto.uf())
				&& isBlankOrNullIfPresent(enderecoDto.complemento())
				&& (!enderecoDto.numero().isPresent() || enderecoDto.numero().isNull());

		// Remove o endereço apenas se o CEP foi explicitamente limpo/nulo (sem outros campos preenchidos)
		// ou se o cliente ainda não tinha endereço e nenhum campo válido foi informado.
		if (todosPresentesVazios && (enderecoDto.cep().isPresent() || cliente.getEndereco() == null)) {
			cliente.setEndereco(null);
			return;
		}

		boolean criandoNovo = (cliente.getEndereco() == null);
		Endereco enderecoAtual = cliente.getEndereco();
		if (enderecoAtual == null) {
			enderecoAtual = new Endereco();
		}

		if (enderecoDto.numero().isPresent()) {
			Integer numero = enderecoDto.numero().get();
			if (numero == null) {
				throw new BusinessValidationException("Número do endereço é obrigatório.");
			}
			enderecoAtual.setNumero(numero);
		}

		enderecoDto.complemento().ifPresent(enderecoAtual::setComplemento);

		if (enderecoDto.cep().isPresent()) {
			String cepRaw = enderecoDto.cep().get();
			String novoCepStr = cepRaw != null ? cepRaw.replaceAll("[^0-9]", "") : null;
			if (novoCepStr != null && !novoCepStr.isBlank()) {
				Cep cepAtual = enderecoAtual.getCep();
				if (cepAtual == null || !novoCepStr.equals(cepAtual.getCep())) {
					Cep cepFinal = resolverOuCriarCep(
							novoCepStr,
							enderecoDto.uf().valueOr(null),
							enderecoDto.cidade().valueOr(null),
							enderecoDto.bairro().valueOr(null),
							enderecoDto.logradouro().valueOr(null));
					enderecoAtual.setCep(cepFinal);
				} else {
					atualizarCamposCepExistente(cepAtual, enderecoDto);
				}
			} else if (enderecoAtual.getCep() == null) {
				throw new BusinessValidationException("CEP é obrigatório para o endereço.");
			}
		} else if (criandoNovo) {
			// Novo endereço sem CEP informado — obrigatório
			throw new BusinessValidationException("CEP é obrigatório para o endereço.");
		} else if (enderecoAtual.getCep() != null) {
			atualizarCamposCepExistente(enderecoAtual.getCep(), enderecoDto);
		}

		// Vincula o endereço ao cliente somente após todas as validações
		if (criandoNovo) {
			cliente.setEndereco(enderecoAtual);
		}
	}

	private void atualizarCamposCepExistente(Cep cepAtual, UpdateClienteDTO.EnderecoDTO enderecoDto) {
		if (enderecoDto.logradouro().isPresent()) {
			String logradouro = enderecoDto.logradouro().get();
			if (logradouro == null || logradouro.isBlank()) {
				throw new BusinessValidationException("Logradouro é obrigatório.");
			}
			cepAtual.setLogradouro(logradouro);
		}
		if (enderecoDto.bairro().isPresent()) {
			String bairro = enderecoDto.bairro().get();
			if (bairro == null || bairro.isBlank()) {
				throw new BusinessValidationException("Bairro é obrigatório.");
			}
			cepAtual.setBairro(bairro);
		}
		if (enderecoDto.cidade().isPresent()) {
			String cidade = enderecoDto.cidade().get();
			if (cidade == null || cidade.isBlank()) {
				throw new BusinessValidationException("Cidade é obrigatória.");
			}
			cepAtual.setCidade(cidade);
		}
		if (enderecoDto.uf().isPresent()) {
			String uf = enderecoDto.uf().get();
			if (uf == null || uf.isBlank()) {
				throw new BusinessValidationException("UF é obrigatória.");
			}
			cepAtual.setUf(uf);
		}
	}

	private boolean isBlankOrNullIfPresent(PatchField<String> field) {
		if (field.isOmitted()) {
			return true;
		}
		String val = field.get();
		return val == null || val.isBlank();
	}
}
