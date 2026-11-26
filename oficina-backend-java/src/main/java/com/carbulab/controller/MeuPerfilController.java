package com.carbulab.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.cliente.AlterarMinhaSenhaDTO;
import com.carbulab.dto.cliente.ConfirmarTrocaEmailDTO;
import com.carbulab.dto.cliente.ResponseMeuPerfilDTO;
import com.carbulab.dto.cliente.SolicitarTrocaEmailDTO;
import com.carbulab.dto.dashboard.DashboardClienteDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;
import com.carbulab.service.MeuPerfilService;

import jakarta.validation.Valid;

/**
 * Controller exclusivo para clientes autenticados (ROLE_USER).
 * 
 * Regra de Segurança Fundamental:
 * - O ID do cliente NUNCA é aceito como parâmetro na requisição.
 * - Todas as consultas e operações resolvem os dados unicamente a partir do principal autenticado.
 * - Fornece visualização dos dados cadastrais (sem veículos embutidos, seguindo boas práticas).
 * - Não permite edição direta de dados cadastrais pela API do cliente, exceto senha e e-mail com código de confirmação.
 */
@RestController
@RequestMapping("/api/meu-perfil")
@PreAuthorize("hasRole('CLIENTE')")
public class MeuPerfilController {

    private final MeuPerfilService meuPerfilService;

    public MeuPerfilController(MeuPerfilService meuPerfilService) {
        this.meuPerfilService = meuPerfilService;
    }

    /**
     * Visualização do cadastro do cliente autenticado (dados pessoais e endereço, sem veículos).
     */
    @GetMapping
    public ResponseEntity<ResponseMeuPerfilDTO> meuPerfil() {
		String email = getEmailUsuarioAutenticado();
        ResponseMeuPerfilDTO perfil = meuPerfilService.obterMeuPerfil(email);
        return ResponseEntity.ok(perfil);
    }

    /**
     * Retorna indicadores e dados consolidados para o dashboard do cliente:
     * - Número de veículos
     * - Número de ordens de serviço
     * - Previsão de próxima revisão por veículo (última OS finalizada + 6 meses, com contagem de dias restantes e status EM_DIA, PROXIMA, ATRASADA ou SEM_HISTORICO)
     * - 5 últimas ordens de serviço
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardClienteDTO> meuDashboard() {
        String email = getEmailUsuarioAutenticado();
        DashboardClienteDTO dashboard = meuPerfilService.obterDashboardCliente(email);
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Lista todos os veículos pertencentes ao cliente autenticado de forma paginada.
     */
    @GetMapping("/veiculos")
    public ResponseEntity<Page<ResponseVeiculoDTO>> meusVeiculos(@PageableDefault(size = 10) Pageable pageable) {
        String email = getEmailUsuarioAutenticado();
        Page<ResponseVeiculoDTO> veiculos = meuPerfilService.obterMeusVeiculosPaginado(email, pageable);
        return ResponseEntity.ok(veiculos);
    }

    /**
     * Busca os veículos do cliente autenticado pela placa de forma paginada (isolamento total).
     */
    @GetMapping("/veiculos/search/placa")
    public ResponseEntity<Page<ResponseVeiculoDTO>> buscarMeusVeiculosPorPlaca(
            @RequestParam("placa") String placa,
            @PageableDefault(size = 10) Pageable pageable) {
        String email = getEmailUsuarioAutenticado();
        Page<ResponseVeiculoDTO> veiculos = meuPerfilService.buscarMeusVeiculosPorPlacaPaginado(email, placa, pageable);
        return ResponseEntity.ok(veiculos);
    }

    /**
     * Lista as ordens de serviço pertencentes ao cliente autenticado de forma paginada.
     */
    @GetMapping("/os")
    public ResponseEntity<Page<ResponseOsDTO>> minhasOrdensServico(@PageableDefault(size = 10) Pageable pageable) {
        String email = getEmailUsuarioAutenticado();
        Page<ResponseOsDTO> osList = meuPerfilService.obterMinhasOrdensServicoPaginado(email, pageable);
        return ResponseEntity.ok(osList);
    }

    /**
     * Lista as ordens de serviço de um veículo específico do cliente autenticado (filtrado por placa), de forma paginada.
     */
    @GetMapping("/os/veiculo")
    public ResponseEntity<Page<ResponseOsDTO>> minhasOrdensServicoPorVeiculo(
            @RequestParam("placa") String placa,
            @PageableDefault(size = 10) Pageable pageable) {
        String email = getEmailUsuarioAutenticado();
        Page<ResponseOsDTO> osList = meuPerfilService.obterMinhasOrdensServicoPorPlacaPaginado(email, placa, pageable);
        return ResponseEntity.ok(osList);
    }

    /**
     * Detalhes de uma ordem de serviço específica do cliente autenticado.
     */
    @GetMapping("/os/{id}")
    public ResponseEntity<ResponseOsDTO> minhaOrdemServicoPorId(@PathVariable Integer id) {
        String email = getEmailUsuarioAutenticado();
        ResponseOsDTO os = meuPerfilService.obterMinhaOrdemServicoPorId(email, id);
        return ResponseEntity.ok(os);
    }

    /**
     * Download / visualização do PDF de uma ordem de serviço do cliente autenticado.
     */
    @GetMapping("/os/{id}/pdf")
    public ResponseEntity<byte[]> meuPdfOrdemServico(@PathVariable Integer id) {
        String email = getEmailUsuarioAutenticado();
        byte[] pdfBytes = meuPerfilService.gerarPdfMinhaOrdemServico(email, id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        String fileName = "os_" + id + ".pdf";
        headers.add("Content-Disposition", "inline; filename=\"" + fileName + "\"");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    /**
     * Alteração de senha pelo próprio cliente autenticado.
     */
    @PutMapping("/senha")
    public ResponseEntity<Map<String, String>> alterarSenha(@RequestBody @Valid AlterarMinhaSenhaDTO dto) {
        String email = getEmailUsuarioAutenticado();
        meuPerfilService.alterarMinhaSenha(email, dto);
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso!"));
    }

    /**
     * Solicitação de troca de e-mail com envio de código de 6 dígitos para o novo endereço.
     */
    @PostMapping("/email/solicitar")
    public ResponseEntity<Map<String, String>> solicitarTrocaEmail(@RequestBody @Valid SolicitarTrocaEmailDTO dto) {
        String email = getEmailUsuarioAutenticado();
        meuPerfilService.solicitarTrocaEmail(email, dto);
        return ResponseEntity.ok(Map.of("message", "Código de verificação enviado com sucesso para o novo e-mail."));
    }

    /**
     * Confirmação da troca de e-mail informando o código de verificação recebido.
     */
    @PostMapping("/email/confirmar")
    public ResponseEntity<Map<String, String>> confirmarTrocaEmail(@RequestBody @Valid ConfirmarTrocaEmailDTO dto) {
        String email = getEmailUsuarioAutenticado();
        meuPerfilService.confirmarTrocaEmail(email, dto);
        return ResponseEntity.ok(Map.of("message", "E-mail alterado com sucesso!"));
    }

    private String getEmailUsuarioAutenticado() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Usuario usuario) {
            return usuario.getEmail();
        }
        throw new IllegalStateException("Usuário autenticado não encontrado na sessão.");
    }
}
