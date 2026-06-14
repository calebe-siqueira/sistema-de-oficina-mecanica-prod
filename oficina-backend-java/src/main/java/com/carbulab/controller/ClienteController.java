package com.carbulab.controller;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.carbulab.cliente.ClienteService;
import com.carbulab.cliente.ClienteResponseDTO;
import com.carbulab.cliente.dto.CreateClienteDTO;
import com.carbulab.cliente.dto.UpdateClienteDTO;
import com.carbulab.cliente.dto.SearchClienteDTO;

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

    @Autowired
    private ClienteService service;

    // ======================== GET ==========================
    
    /**
     * Listar todos os clientes
     * GET /api/clientes
     */
    @GetMapping
    public ResponseEntity<List<ClienteResponseDTO>> listar() {
        List<ClienteResponseDTO> clientes = service.listarTodos();
        return ResponseEntity.ok(clientes);
    }

    /**
     * Buscar cliente por ID com opção de incluir dados relacionados
     * 
     * GET /api/clientes/{id}                              → dados básicos (rápido)
     * GET /api/clientes/{id}?endereco=true               → com endereço
     * GET /api/clientes/{id}?veiculos=true               → com veículos
     * GET /api/clientes/{id}?endereco=true&veiculos=true → com endereço e veículos
     * GET /api/clientes/{id}?all=true                    → tudo (compatibilidade com frontend antigo)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> buscarPorId(
            @PathVariable Long id,
            @RequestParam(name = "endereco", required = false, defaultValue = "false") boolean includeEndereco,
            @RequestParam(name = "veiculos", required = false, defaultValue = "false") boolean includeVeiculos,
            @RequestParam(name = "all", required = false, defaultValue = "true") boolean includeAll) {
        
        // Se 'all=true', incluir tudo
        boolean end = includeAll || includeEndereco;
        boolean vei = includeAll || includeVeiculos;
        
        ClienteResponseDTO cliente = service.buscarPorIdCompleto(id, end, vei);
        return ResponseEntity.ok(cliente);
    }

    /**
     * Buscar clientes com filtros
     * GET /api/clientes/search?termo=valor&tipo=nome
     */
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> buscar(
            @RequestParam(name = "term") String termo,
            @RequestParam(name = "type") String tipo) {
        
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
    public ResponseEntity<ClienteResponseDTO> criar(@RequestBody CreateClienteDTO dto) {
        ClienteResponseDTO novoCliente = service.criar(dto);

        return ResponseEntity.status(201).body(novoCliente);
    }

    // ======================== PUT ==========================

    /**
     * Atualizar cliente existente
     * PUT /api/clientes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponseDTO> atualizar(
            @PathVariable Long id,
            @RequestBody UpdateClienteDTO dto) {
        
        ClienteResponseDTO clienteAtualizado = service.atualizar(id, dto);
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
    
}
