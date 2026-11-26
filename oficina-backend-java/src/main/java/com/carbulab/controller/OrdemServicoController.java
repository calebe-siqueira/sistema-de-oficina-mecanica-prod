package com.carbulab.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import com.carbulab.dto.ordem_servico.CreateOsDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.ordem_servico.UpdateOsDTO;
import com.carbulab.dto.ordem_servico.SearchOsDTO;
import com.carbulab.service.OrdemServicoService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/os")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;

    public OrdemServicoController(OrdemServicoService ordemServicoService) {
        this.ordemServicoService = ordemServicoService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO')")
    public ResponseEntity<Page<ResponseOsDTO>> listarTodos(@RequestParam(required = false) Integer status, @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ordemServicoService.listarTodos(status, pageable));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO')")
    public ResponseEntity<Page<ResponseOsDTO>> buscar(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) String term,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ordemServicoService.buscar(new SearchOsDTO(clienteId, type, term, dataInicio, dataFim, status), pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO') or @securityRules.isOsOwner(authentication, #id)") // Autoriza quem é ADMIN, MECANICO ou é dono do recurso acessado
    public ResponseEntity<ResponseOsDTO> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(ordemServicoService.buscarPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO')")
    public ResponseEntity<ResponseOsDTO> criar(@RequestBody @Valid CreateOsDTO dto) {
        ResponseOsDTO criado = ordemServicoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO')")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        ordemServicoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO')")
    public ResponseEntity<ResponseOsDTO> atualizar(@PathVariable Integer id,
            @RequestBody @Valid UpdateOsDTO dto) {
        return ResponseEntity.ok(ordemServicoService.atualizarOs(id, dto));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MECANICO') or @securityRules.isOsOwner(authentication, #id)") // Autoriza quem é ADMIN, MECANICO ou é dono do recurso acessado
    public ResponseEntity<byte[]> getOsPdf(@PathVariable Integer id) {
        byte[] pdfBytes = ordemServicoService.gerarPdfOs(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String fileName = "os_" + id + ".pdf";
        headers.add("Content-Disposition", "inline; filename=\"" + fileName + "\"");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    // ======================== RESTORE (LIXEIRA) ==========================

    @GetMapping("/lixeira")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Page<ResponseOsDTO>> listarLixeira(@PageableDefault(size = 50) Pageable pageable) {
        Page<ResponseOsDTO> osDeletadas = ordemServicoService.listarLixeira(pageable);
        return ResponseEntity.ok(osDeletadas);
    }

    @PutMapping("/lixeira/{id}/restaurar")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> restaurar(@PathVariable Integer id) {
        ordemServicoService.restaurar(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lixeira/{id}/permanente")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deletarPermanentemente(@PathVariable Integer id) {
        ordemServicoService.deletarPermanentemente(id);
        return ResponseEntity.noContent().build();
    }
}
