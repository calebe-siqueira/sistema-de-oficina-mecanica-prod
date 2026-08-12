package com.carbulab.controller;

import java.util.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carbulab.dto.cliente.CreateClienteDTO;
import com.carbulab.dto.cliente.ResponseClienteDTO;
import com.carbulab.dto.cliente.SearchClienteDTO;
import com.carbulab.dto.cliente.UpdateClienteDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.veiculo.CreateVeiculoDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;
import com.carbulab.service.ClienteService;

import jakarta.validation.Valid;

/**
 * Controlador para CLIENTE
 * 
 * Responsabilidades:
 * - Receber requisições HTTP
 * - Validar parâmetros HTTP
 * - Chamar ClienteService para lógica de negócio
 * - Retornar respostas HTTP apropriadas
 * 
 * NÃO faz:
 * - Acesso direto ao banco de dados
 * - Lógica de negócio
 */

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

	private final ClienteService service;
	private final com.carbulab.service.VeiculoService veiculoService;
	private final com.carbulab.service.OrdemServicoService ordemServicoService;

	public ClienteController(ClienteService service, com.carbulab.service.VeiculoService veiculoService, com.carbulab.service.OrdemServicoService ordemServicoService) {
		this.service = service;
		this.veiculoService = veiculoService;
		this.ordemServicoService = ordemServicoService;
	}

	// ======================== GET ==========================
	
	/**
	 * Listar todos os clientes
	 * GET /api/clientes
	 */
	@GetMapping
	public ResponseEntity<List<ResponseClienteDTO>> listar() {
		List<ResponseClienteDTO> clientes = service.listarTodos();
		return ResponseEntity.ok(clientes);
	}

	/**
	 * Buscar cliente por ID com opção de incluir dados relacionados
	 * 
	 * GET /api/clientes/{id}							  → dados básicos (rápido)
	 * GET /api/clientes/{id}?endereco=true			   → com endereço
	 * GET /api/clientes/{id}?veiculos=true			   → com veículos
	 * GET /api/clientes/{id}?endereco=true&veiculos=true → com endereço e veículos
	 * GET /api/clientes/{id}?all=true					→ tudo (compatibilidade com frontend antigo)
	 */
	@GetMapping("/{id}")
	public ResponseEntity<ResponseClienteDTO> buscarPorId(
			@PathVariable Long id,
			@RequestParam(name = "endereco", required = false, defaultValue = "false") boolean includeEndereco,
			@RequestParam(name = "veiculos", required = false, defaultValue = "false") boolean includeVeiculos,
			@RequestParam(name = "all", required = false, defaultValue = "true") boolean includeAll) {
		
		// Se 'all=true', incluir tudo
		boolean end = includeAll || includeEndereco;
		boolean vei = includeAll || includeVeiculos;
		
		ResponseClienteDTO cliente = service.buscarPorIdCompleto(id, end, vei);
		return ResponseEntity.ok(cliente);
	}

	@GetMapping("/{id}/veiculos")
	public ResponseEntity<List<ResponseVeiculoDTO>> listarVeiculos(@PathVariable Long id) {
		List<ResponseVeiculoDTO> veiculos = veiculoService.listarVeiculosPorCliente(id);
		return ResponseEntity.ok(veiculos);
	}

	@GetMapping("/{id}/os")
	public ResponseEntity<List<ResponseOsDTO>> listarOs(@PathVariable Long id) {
		List<ResponseOsDTO> osList = ordemServicoService.listarOsPorCliente(id);
		return ResponseEntity.ok(osList);
	}

	/**
	 * Buscar clientes com filtros
	 * GET /api/clientes/search?termo=valor&tipo=nome
	 */
	@GetMapping("/search")
	public ResponseEntity<List<Map<String, Object>>> buscar(
		@RequestParam(name = "term") String termo,
		@RequestParam(name = "type") String tipo
		// @RequestParam(name = "limit", required = false, defaultValue = "") Integer limit
	) {
		SearchClienteDTO searchDto = new SearchClienteDTO(termo, tipo);
		List<Map<String, Object>> resultado = service.buscar(searchDto);
		return ResponseEntity.ok(resultado);
	}

	// ======================== POST ==========================

	/**
	 * Criar novo cliente
	 * POST /api/clientes
	 */
	@PostMapping
	public ResponseEntity<ResponseClienteDTO> criar(@RequestBody CreateClienteDTO dto) {
		ResponseClienteDTO novoCliente = service.criar(dto);
		
		return ResponseEntity.status(201).body(novoCliente);
	}

	@PostMapping("/{id}/veiculos")
	public ResponseEntity<ResponseVeiculoDTO> criarVeiculo(@PathVariable Long id, @RequestBody @Valid CreateVeiculoDTO dto, @RequestParam(defaultValue = "false") boolean force) {
		CreateVeiculoDTO dtoComCliente = new CreateVeiculoDTO(
			dto.nomeMontadora(), dto.nomeModelo(), dto.ano(), dto.placa(), dto.cor(), dto.combustivel(), dto.tipo(), id
		);
		ResponseVeiculoDTO criado = veiculoService.criar(dtoComCliente, force);
		return ResponseEntity.status(201).body(criado);
	}

	// ======================== PUT ==========================

	/**
	 * Atualizar cliente existente
	 * PUT /api/clientes/{id}
	 */
	@PutMapping("/{id}")
	public ResponseEntity<ResponseClienteDTO> atualizar(
			@PathVariable Long id,
			@RequestBody UpdateClienteDTO dto) {
		
		ResponseClienteDTO clienteAtualizado = service.atualizar(id, dto);
		return ResponseEntity.ok(clienteAtualizado);
	}

	// ======================== DELETE ==========================

	/**
	 * Deletar cliente
	 * DELETE /api/clientes/{id}
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deletar(@PathVariable Long id) {
		service.deletar(id);
		return ResponseEntity.noContent().build();
	}

	// ======================== RESTORE (LIXEIRA) ==========================

	@GetMapping("/lixeira")
	public ResponseEntity<List<ResponseClienteDTO>> listarLixeira() {
		List<ResponseClienteDTO> clientesDeletados = service.listarLixeira();
		return ResponseEntity.ok(clientesDeletados);
	}

	@PutMapping("/lixeira/{id}/restaurar")
	public ResponseEntity<Void> restaurar(@PathVariable Long id) {
		service.restaurar(id);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/lixeira/{id}/permanente")
	public ResponseEntity<Void> deletarPermanentemente(@PathVariable Long id) {
		service.deletarPermanentemente(id);
		return ResponseEntity.noContent().build();
	}
	
}
