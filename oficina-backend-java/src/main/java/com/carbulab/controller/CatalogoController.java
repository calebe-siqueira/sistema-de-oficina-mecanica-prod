package com.carbulab.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

import com.carbulab.service.CatalogoService;
import com.carbulab.domain.veiculo.Montadora;
import com.carbulab.domain.veiculo.Modelo;
import com.carbulab.domain.ordem_servico.Peca;
import com.carbulab.domain.ordem_servico.Servico;

@RestController
@RequestMapping("/api/veiculos")
public class CatalogoController {
    
    private final CatalogoService catalogoService;
    
    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }
    
    @GetMapping("/montadoras")
    public ResponseEntity<List<Montadora>> listarMontadoras() {
        return ResponseEntity.ok(catalogoService.listarMontadoras());
    }
    
    @GetMapping("/montadoras/{id_montadora}/modelos")
    public ResponseEntity<List<Modelo>> listarModelosPorMontadora(@PathVariable Integer id_montadora) {
        return ResponseEntity.ok(catalogoService.listarModelosPorMontadora(id_montadora));
    }

    @GetMapping("/pecas")
    public ResponseEntity<List<Peca>> listarPecas() {
        return ResponseEntity.ok(catalogoService.listarPecas());
    }

    @GetMapping("/servicos")
    public ResponseEntity<List<Servico>> listarServicos() {
        return ResponseEntity.ok(catalogoService.listarServicos());
    }

    // ======================== DELETE (PERMANENTE) ==========================

    @DeleteMapping("/pecas/{id}")
    public ResponseEntity<Void> deletarPeca(@PathVariable Integer id) {
        catalogoService.deletarPecaPermanentemente(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/servicos/{id}")
    public ResponseEntity<Void> deletarServico(@PathVariable Integer id) {
        catalogoService.deletarServicoPermanentemente(id);
        return ResponseEntity.noContent().build();
    }
}
