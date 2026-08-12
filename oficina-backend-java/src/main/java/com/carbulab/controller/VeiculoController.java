package com.carbulab.controller;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.carbulab.dto.ordem_servico.CreateOsDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.veiculo.CreateVeiculoDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDetailsDTO;
import com.carbulab.dto.veiculo.UpdateVeiculoDTO;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.service.OrdemServicoService;
import com.carbulab.service.PdfRelVeiculoService;
import com.carbulab.service.VeiculoService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/veiculos")
public class VeiculoController {

    private final VeiculoService veiculoService;
    private final OrdemServicoService ordemServicoService;
    private final PdfRelVeiculoService pdfRelVeiculoService;
    private final OrdemServicoRepository osRepo;

    public VeiculoController(VeiculoService veiculoService, 
                             OrdemServicoService ordemServicoService, 
                             PdfRelVeiculoService pdfRelVeiculoService, 
                             OrdemServicoRepository osRepo) {
        this.veiculoService = veiculoService;
        this.ordemServicoService = ordemServicoService;
        this.pdfRelVeiculoService = pdfRelVeiculoService;
        this.osRepo = osRepo;
    }

	@GetMapping
    public ResponseEntity<List<ResponseVeiculoDTO>> listarTodos() {
        return ResponseEntity.ok(veiculoService.listarTodos());
    }

	/**
     * Lista os veículos cadastrados no sistema.
	 * 
	 * Permite aplicar filtros a partir das ordens de serviço que aquele veículo possui (exemplo: filtrar apenas os veículos que possuem ordens de serviço com determinado status)
     * 
     * @param statusServico Permite filtrar por status dos serviços daquele veículo (default = null -> lista todos os veículos | 0 lista apenas os veículo que possuem ordens de serviço cadastradas)
     *                  Status válidos: 0 -> Todos, 1 -> Orçamento, 2 -> Ordem de Serviço Aberta, 3 -> Serviço em Andamento, 4 -> Finalizado, 5-> Cancelado
     * @param dataInicio Permite filtrar por data de início
     * @param dataFim Permite filtrar por data de fim
     * @return Lista dos veículos filtrados (ResponseVeiculoDTO)
     * 
     * Exemplo de uso:
     *      GET /api/veiculos/filtro-os?status-servico=1,2,3&dataInicio-servico=2015-01-01&dataFim-servico=2022-01-01
     *      (pega os orçamentos, ordens de serviço abertas e serviço em andamento de 2015 a 2022)
     */
    @GetMapping("/filtro-os")
    public ResponseEntity<List<ResponseVeiculoDTO>> listarTodosFiltroOs(
            @RequestParam(value = "status-servico", required = false) List<Integer> statusServico,
            @RequestParam(value = "dataInicio-servico", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(value = "dataFim-servico", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        
        if (statusServico == null && dataInicio == null && dataFim == null) {
            return ResponseEntity.ok(veiculoService.listarTodos());
        }
        return ResponseEntity.ok(veiculoService.listarComFiltroOs(statusServico, dataInicio, dataFim));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseVeiculoDTO> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(veiculoService.buscarPorId(id));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ResponseVeiculoDetailsDTO> buscarDetalhesPorId(@PathVariable Integer id) {
		ResponseVeiculoDetailsDTO details = veiculoService.buscarDetalhesPorId(id);
		System.out.println(details);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/search/placa")
    public ResponseEntity<ResponseVeiculoDTO> buscarPorPlaca(@RequestParam("placa") String placa) {
        return ResponseEntity.ok(veiculoService.buscarPorPlaca(placa));
    }

    @GetMapping("/{id}/os")
    public ResponseEntity<List<ResponseOsDTO>> listarOs(@PathVariable Integer id) {
        return ResponseEntity.ok(ordemServicoService.listarOsPorVeiculo(id));
    }

    @GetMapping("/{id}/quantidade-os")
    public ResponseEntity<Long> contarOs(@PathVariable Integer id) {
        return ResponseEntity.ok(ordemServicoService.contarOsPorVeiculo(id));
    }

	/**
     * Gera um PDF com as ordens de serviço de um veículo (código do veículo = {id}).
     * 
     * @param id ID do veículo
     * @param status Permite filtrar por status (default = 0 -> lista todos os status)
     *                  Status válidos: 0 -> Todos, 1 -> Orçamento, 2 -> Ordem de Serviço Aberta, 3 -> Serviço em Andamento, 4 -> Finalizado, 5-> Cancelado
     * @param dataInicio Permite filtrar por data de início
     * @param dataFim Permite filtrar por data de fim
     * @return Arquivo PDF com as ordens de serviço do veículo
     * 
     * Exemplo de uso:
     *      GET /api/veiculos/3961/os/pdf?status=1,2,3&dataInicio=2015-01-01&dataFim=2022-01-01
     *      (pega os orçamentos, ordens de serviço abertas e serviço em andamento de 2015 a 2022)
     */
    @GetMapping("/{id}/os/pdf")
    public ResponseEntity<byte[]> getVeiculoOsPdf(
            @PathVariable Integer id,
            @RequestParam(value = "status", required = false, defaultValue = "4") List<Integer> status,
            @RequestParam(value = "dataInicio", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(value = "dataFim", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        
        byte[] pdfBytes = veiculoService.gerarPdfHistoricoVeiculo(id, status, dataInicio, dataFim,
                pdfRelVeiculoService, osRepo);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String fileName = "relatorio_os_veiculo_" + id + ".pdf";
        headers.add("Content-Disposition", "inline; filename=\"" + fileName + "\"");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @PostMapping("/{id_veiculo}/os")
    public ResponseEntity<ResponseOsDTO> criarOs(@PathVariable Integer id_veiculo,
            @RequestBody @Valid CreateOsDTO dto) {

        CreateOsDTO dtoComVeiculo = new CreateOsDTO(
                dto.dataOs(), dto.quilometragem(), dto.descricao(),
                dto.tipoDesconto(), dto.desconto(), dto.statusServico(), dto.valorPago(), id_veiculo, dto.pecas(), dto.servicos());

        ResponseOsDTO criado = ordemServicoService.criar(dtoComVeiculo);

        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PostMapping
    public ResponseEntity<ResponseVeiculoDTO> criar(@RequestBody @Valid CreateVeiculoDTO dto,
            @RequestParam(defaultValue = "false") boolean force) {
        ResponseVeiculoDTO criado = veiculoService.criar(dto, force);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseVeiculoDTO> atualizar(@PathVariable Integer id,
            @RequestBody @Valid UpdateVeiculoDTO dto, @RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.ok(veiculoService.atualizar(id, dto, force));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        veiculoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    // ======================== RESTORE (LIXEIRA) ==========================

    @GetMapping("/lixeira")
    public ResponseEntity<List<ResponseVeiculoDTO>> listarLixeira() {
        List<ResponseVeiculoDTO> veiculosDeletados = veiculoService.listarLixeira();
        return ResponseEntity.ok(veiculosDeletados);
    }

    @PutMapping("/lixeira/{id}/restaurar")
    public ResponseEntity<Void> restaurar(@PathVariable Integer id) {
        veiculoService.restaurar(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lixeira/{id}/permanente")
    public ResponseEntity<Void> deletarPermanentemente(@PathVariable Integer id) {
        veiculoService.deletarPermanentemente(id);
        return ResponseEntity.noContent().build();
    }
}
