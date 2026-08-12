package com.carbulab.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.carbulab.dto.ordem_servico.CreateOsDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.ordem_servico.UpdateOsDTO;
import com.carbulab.service.OrdemServicoService;

import java.util.List;

@RestController
@RequestMapping("/api/os")
public class OrdemServicoController {

    private final OrdemServicoService ordemServicoService;

    public OrdemServicoController(OrdemServicoService ordemServicoService) {
        this.ordemServicoService = ordemServicoService;
    }

    @GetMapping
    public ResponseEntity<List<ResponseOsDTO>> listarTodos(@RequestParam(required = false) Integer status) {
        return ResponseEntity.ok(ordemServicoService.listarTodos(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseOsDTO> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(ordemServicoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ResponseOsDTO> criar(@RequestBody @Valid CreateOsDTO dto) {
        ResponseOsDTO criado = ordemServicoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        ordemServicoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseOsDTO> atualizar(@PathVariable Integer id,
            @RequestBody @Valid UpdateOsDTO dto) {
        return ResponseEntity.ok(ordemServicoService.atualizarOs(id, dto));
    }

    @GetMapping("/{id}/pdf")
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
    public ResponseEntity<List<ResponseOsDTO>> listarLixeira() {
        List<ResponseOsDTO> osDeletadas = ordemServicoService.listarLixeira();
        return ResponseEntity.ok(osDeletadas);
    }

    @PutMapping("/lixeira/{id}/restaurar")
    public ResponseEntity<Void> restaurar(@PathVariable Integer id) {
        ordemServicoService.restaurar(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lixeira/{id}/permanente")
    public ResponseEntity<Void> deletarPermanentemente(@PathVariable Integer id) {
        ordemServicoService.deletarPermanentemente(id);
        return ResponseEntity.noContent().build();
    }
}
