package com.carbulab.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.passay.CharacterRule;
import org.passay.EnglishCharacterData;
import org.passay.EnglishSequenceData;
import org.passay.IllegalSequenceRule;
import org.passay.LengthRule;
import org.passay.PasswordData;
import org.passay.PasswordValidator;
import org.passay.Rule;
import org.passay.RuleResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.ordem_servico.OrdemServico;
import com.carbulab.domain.usuario.Usuario;
import com.carbulab.domain.veiculo.Veiculo;
import com.carbulab.dto.cliente.AlterarMinhaSenhaDTO;
import com.carbulab.dto.cliente.ConfirmarTrocaEmailDTO;
import com.carbulab.dto.cliente.ResponseMeuPerfilDTO;
import com.carbulab.dto.cliente.SolicitarTrocaEmailDTO;
import com.carbulab.dto.dashboard.DashboardClienteDTO;
import com.carbulab.dto.dashboard.ProximaRevisaoDTO;
import com.carbulab.dto.dashboard.UltimaOsResumoDTO;
import com.carbulab.dto.ordem_servico.ResponseOsDTO;
import com.carbulab.dto.veiculo.ResponseVeiculoDTO;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.ClienteRepository;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.repositories.PessoaRepository;
import com.carbulab.repositories.UsuarioRepository;
import com.carbulab.repositories.VeiculoRepository;

/**
 * Serviço dedicado às operações do próprio cliente autenticado (Meu Perfil).
 * 
 * - Garante isolamento estrito de dados (resolve o cliente unicamente pelo e-mail do usuário autenticado).
 * - Fornece visualização completa dos dados cadastrais (sem permitir edição direta, exceto senha e e-mail).
 * - Gerencia o ciclo de vida de alteração de senha e e-mail (com código de verificação).
 */
@Service
public class MeuPerfilService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final ClienteService clienteService;
    private final VeiculoService veiculoService;
    private final OrdemServicoService ordemServicoService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final VerificationCodeService verificationCodeService;
    private final PessoaRepository pessoaRepository;

    public MeuPerfilService(
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            VeiculoRepository veiculoRepository,
            OrdemServicoRepository ordemServicoRepository,
            ClienteService clienteService,
            VeiculoService veiculoService,
            OrdemServicoService ordemServicoService,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            VerificationCodeService verificationCodeService,
            PessoaRepository pessoaRepository) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.veiculoRepository = veiculoRepository;
        this.ordemServicoRepository = ordemServicoRepository;
        this.clienteService = clienteService;
        this.veiculoService = veiculoService;
        this.ordemServicoService = ordemServicoService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.verificationCodeService = verificationCodeService;
        this.pessoaRepository = pessoaRepository;
    }

    /**
     * Retorna os dados cadastrais e endereço do cliente logado (sem veículos).
     */
    @Transactional(readOnly = true)
    public ResponseMeuPerfilDTO obterMeuPerfil(String emailLogado) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return clienteService.buscarMeuPerfil(cliente.getCod_cliente());
    }

    /**
     * Retorna os dados consolidados do dashboard do cliente logado:
     * - Total de veículos
     * - Total de ordens de serviço
     * - Próximas revisões por veículo (última OS finalizada + 6 meses)
     * - 5 últimas ordens de serviço
     */
    @Transactional(readOnly = true)
    public DashboardClienteDTO obterDashboardCliente(String emailLogado) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        Long clienteId = cliente.getCod_cliente();

        Long totalVeiculos = veiculoRepository.countByClienteIdAndDeletedAtIsNull(clienteId);
        Long totalOs = ordemServicoRepository.countByClienteIdAtivas(clienteId);

        List<Veiculo> veiculos = veiculoRepository.findByClienteIdAtivo(clienteId);
        List<ProximaRevisaoDTO> proximasRevisoes = new ArrayList<>();

        LocalDate hoje = LocalDate.now();
        for (Veiculo v : veiculos) {
            List<OrdemServico> osFinalizadas = ordemServicoRepository.findUltimaOsFinalizadaPorVeiculo(v.getCod_veiculo(), PageRequest.of(0, 1));

            String modeloNome = v.getModelo() != null ? v.getModelo().getNomeModelo() : "";
            String montadoraNome = (v.getModelo() != null && v.getModelo().getMontadora() != null)
                    ? v.getModelo().getMontadora().getNomeMontadora() : "";

            if (!osFinalizadas.isEmpty()) {
                LocalDate dataUltima = osFinalizadas.get(0).getDataOs();
                LocalDate dataProx = dataUltima != null ? dataUltima.plusMonths(6) : null;
                Long diasRestantes = (dataProx != null) ? ChronoUnit.DAYS.between(hoje, dataProx) : null;

                String statusRevisao;
                if (diasRestantes == null) {
                    statusRevisao = "SEM_HISTORICO";
                } else if (diasRestantes < 0) {
                    statusRevisao = "ATRASADA";
                } else if (diasRestantes <= 30) {
                    statusRevisao = "PROXIMA";
                } else {
                    statusRevisao = "EM_DIA";
                }

                proximasRevisoes.add(new ProximaRevisaoDTO(
                        v.getCod_veiculo(),
                        v.getPlaca(),
                        modeloNome,
                        montadoraNome,
                        dataUltima,
                        dataProx,
                        statusRevisao,
                        diasRestantes
                ));
            } else {
                proximasRevisoes.add(new ProximaRevisaoDTO(
                        v.getCod_veiculo(),
                        v.getPlaca(),
                        modeloNome,
                        montadoraNome,
                        null,
                        null,
                        "SEM_HISTORICO",
                        null
                ));
            }
        }

        Page<OrdemServico> top5Page = ordemServicoRepository.findByClienteIdAtivasPaged(clienteId, PageRequest.of(0, 5));
        List<UltimaOsResumoDTO> ultimasOs = top5Page.getContent().stream().map(os -> {
            String modNome = (os.getVeiculo() != null && os.getVeiculo().getModelo() != null)
                    ? os.getVeiculo().getModelo().getNomeModelo() : "";
            String montNome = (os.getVeiculo() != null && os.getVeiculo().getModelo() != null && os.getVeiculo().getModelo().getMontadora() != null)
                    ? os.getVeiculo().getModelo().getMontadora().getNomeMontadora() : "";
            String veiculoDesc = (!montNome.isBlank() ? montNome + " " : "")
                    + (!modNome.isBlank() ? modNome : "Veículo")
                    + (os.getVeiculo() != null && os.getVeiculo().getPlaca() != null ? " - " + os.getVeiculo().getPlaca() : "");
            String placa = os.getVeiculo() != null ? os.getVeiculo().getPlaca() : "";
            BigDecimal valorTotal = ordemServicoService.calcularValorTotal(os);

            return new UltimaOsResumoDTO(
                    os.getCodOs(),
                    os.getDataOs(),
                    os.getStatusServico(),
                    obterDescricaoStatus(os.getStatusServico()),
                    veiculoDesc,
                    placa,
                    modNome,
                    valorTotal
            );
        }).toList();

        return new DashboardClienteDTO(totalVeiculos, totalOs, proximasRevisoes, ultimasOs);
    }

    /**
     * Retorna todos os veículos do cliente logado (lista completa).
     */
    @Transactional(readOnly = true)
    public List<ResponseVeiculoDTO> obterMeusVeiculos(String emailLogado) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return veiculoService.listarVeiculosPorCliente(cliente.getCod_cliente());
    }

    /**
     * Retorna os veículos do cliente logado de forma paginada.
     */
    @Transactional(readOnly = true)
    public Page<ResponseVeiculoDTO> obterMeusVeiculosPaginado(String emailLogado, Pageable pageable) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return veiculoService.listarVeiculosPorClientePaginado(cliente.getCod_cliente(), pageable);
    }

    /**
     * Busca veículos do cliente logado por placa com paginação (isolamento estrito por cliente).
     */
    @Transactional(readOnly = true)
    public Page<ResponseVeiculoDTO> buscarMeusVeiculosPorPlacaPaginado(String emailLogado, String placa, Pageable pageable) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return veiculoService.buscarVeiculosPorClienteEPlaca(cliente.getCod_cliente(), placa, pageable);
    }

    /**
     * Retorna o histórico de ordens de serviço do cliente logado (lista completa).
     */
    @Transactional(readOnly = true)
    public List<ResponseOsDTO> obterMinhasOrdensServico(String emailLogado) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return ordemServicoService.listarOsPorCliente(cliente.getCod_cliente());
    }

    /**
     * Retorna o histórico de ordens de serviço do cliente logado de forma paginada.
     */
    @Transactional(readOnly = true)
    public Page<ResponseOsDTO> obterMinhasOrdensServicoPaginado(String emailLogado, Pageable pageable) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return ordemServicoService.listarOsPorClientePaginado(cliente.getCod_cliente(), pageable);
    }

    /**
     * Retorna as ordens de serviço do cliente logado filtradas por veículo (placa) de forma paginada.
     */
    @Transactional(readOnly = true)
    public Page<ResponseOsDTO> obterMinhasOrdensServicoPorPlacaPaginado(String emailLogado, String placa, Pageable pageable) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        return ordemServicoService.listarOsPorClienteEPlacaPaginado(cliente.getCod_cliente(), placa, pageable);
    }

    private String obterDescricaoStatus(Integer status) {
        if (status == null) return "Desconhecido";
        return switch (status) {
            case 1 -> "Orçamento";
            case 2 -> "Ordem de Serviço Aberta";
            case 3 -> "Serviço em Andamento";
            case 4 -> "Finalizado";
            case 5 -> "Cancelado";
            default -> "Outro";
        };
    }

    /**
     * Retorna os detalhes de uma ordem de serviço específica, validando se pertence ao cliente logado.
     */
    @Transactional(readOnly = true)
    public ResponseOsDTO obterMinhaOrdemServicoPorId(String emailLogado, Integer osId) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        validarPropriedadeOs(cliente, osId);
        return ordemServicoService.buscarPorId(osId);
    }

    /**
     * Gera o PDF de uma ordem de serviço específica, validando se pertence ao cliente logado.
     */
    @Transactional(readOnly = true)
    public byte[] gerarPdfMinhaOrdemServico(String emailLogado, Integer osId) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        validarPropriedadeOs(cliente, osId);
        return ordemServicoService.gerarPdfOs(osId);
    }

    /**
     * Altera a senha do próprio usuário logado.
     */
    @Transactional
    public void alterarMinhaSenha(String emailLogado, AlterarMinhaSenhaDTO dto) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(emailLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        if (!passwordEncoder.matches(dto.senha_atual(), usuario.getSenha())) {
            throw new BusinessValidationException("A senha atual informada está incorreta.");
        }

        if (!dto.nova_senha().equals(dto.confirmacao_nova_senha())) {
            throw new BusinessValidationException("A nova senha e a confirmação de nova senha não coincidem.");
        }

        if (passwordEncoder.matches(dto.nova_senha(), usuario.getSenha())) {
            throw new BusinessValidationException("A nova senha não pode ser idêntica à senha atual.");
        }

        validarPoliticaSenha(dto.nova_senha(), usuario);

        usuario.setSenha(passwordEncoder.encode(dto.nova_senha()));
        usuario.setUltimaAlteracaoSenha(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    /**
     * Solicita a troca de e-mail enviando um código de verificação para o novo endereço de e-mail.
     */
    @Transactional
    public void solicitarTrocaEmail(String emailLogado, SolicitarTrocaEmailDTO dto) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        String novoEmail = dto.novo_email().trim().toLowerCase();

        if (novoEmail.equalsIgnoreCase(emailLogado)) {
            throw new BusinessValidationException("O novo e-mail informado já é o seu e-mail cadastrado.");
        }

        // Valida unicidade global do e-mail (tb_pessoa cobre ambos cliente e usuário)
        Long codPessoa = cliente.getPessoa().getCodPessoa();
        if (pessoaRepository.existsByEmailIgnoreCaseAndCodPessoaNot(novoEmail, codPessoa)) {
            throw new BusinessValidationException("Este e-mail já está cadastrado para outro cliente ou usuário do sistema.");
        }

        String codigo = verificationCodeService.gerarCodigoTrocaEmail(cliente.getCodCliente(), novoEmail);
        boolean enviado = emailService.enviarCodigoVerificacaoTrocaEmail(novoEmail, cliente.getNome(), codigo);

        if (!enviado) {
            throw new BusinessValidationException("Não foi possível enviar o e-mail com o código de verificação. Verifique o endereço ou tente mais tarde.");
        }
    }

    /**
     * Confirma a troca de e-mail após a validação do código de 6 dígitos.
     */
    @Transactional
    public void confirmarTrocaEmail(String emailLogado, ConfirmarTrocaEmailDTO dto) {
        Cliente cliente = buscarClientePorEmail(emailLogado);
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(emailLogado)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        String novoEmail = dto.novo_email().trim().toLowerCase();

        boolean codigoValido = verificationCodeService.validarCodigoTrocaEmail(cliente.getCodCliente(), novoEmail, dto.codigo());
        if (!codigoValido) {
            throw new BusinessValidationException("Código de verificação inválido, incorreto ou expirado.");
        }

        // Atualiza o e-mail na entidade Pessoa (fonte única de verdade).
        // Como cliente e usuário compartilham a mesma Pessoa, a alteração
        // reflete automaticamente em ambos os contextos sem operações adicionais.
        cliente.getPessoa().setEmail(novoEmail);
        clienteRepository.save(cliente); // propaga o MERGE na Pessoa via CascadeType.MERGE

        // Atualiza login, caso ele fosse o e-mail antigo
        if (usuario.getLogin() != null && usuario.getLogin().equalsIgnoreCase(emailLogado)) {
            usuario.setLogin(novoEmail);
            usuarioRepository.save(usuario);
        }

        verificationCodeService.invalidarCodigoTrocaEmail(cliente.getCodCliente());
    }

    private Cliente buscarClientePorEmail(String email) {
        // Tenta resolver via FK do usuário (fonte de verdade primária)
        var usuarioOpt = usuarioRepository.findByEmailIgnoreCase(email);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getFkCodCliente() != null) {
            return clienteRepository.findById(usuarioOpt.get().getFkCodCliente())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Cadastro de cliente não encontrado para o ID: " + usuarioOpt.get().getFkCodCliente()));
        }

        return clienteRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cadastro de cliente não encontrado para o e-mail autenticado: " + email));
    }

    private void validarPropriedadeOs(Cliente cliente, Integer osId) {
        OrdemServico os = ordemServicoRepository.findById(osId)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de serviço não encontrada com ID: " + osId));

        if (os.getVeiculo() == null || os.getVeiculo().getCliente() == null) {
            throw new AccessDeniedException("Você não tem permissão para visualizar esta ordem de serviço.");
        }

        if (os.getVeiculo().getCliente().getCod_cliente() != cliente.getCod_cliente()) {
            throw new AccessDeniedException("Você não tem permissão para acessar ordens de serviço de outros clientes.");
        }
    }

    private void validarPoliticaSenha(String senha, Usuario usuario) {
        String senhaLower = senha.toLowerCase();

        if (usuario.getLogin() != null && !usuario.getLogin().isBlank()) {
            if (senhaLower.contains(usuario.getLogin().toLowerCase())) {
                throw new BusinessValidationException("A nova senha não pode conter o seu login.");
            }
        }

        if (usuario.getEmail() != null && !usuario.getEmail().isBlank()) {
            String emailPart = usuario.getEmail().split("@")[0].toLowerCase();
            if (senhaLower.contains(emailPart)) {
                throw new BusinessValidationException("A nova senha não pode conter partes do seu e-mail.");
            }
        }

        if (usuario.getNome() != null && !usuario.getNome().isBlank()) {
            String primeiroNome = usuario.getNome().split(" ")[0].toLowerCase();
            if (senhaLower.contains(primeiroNome)) {
                throw new BusinessValidationException("A nova senha não pode conter o seu nome.");
            }
        }

        List<Rule> rules = new ArrayList<>();
        rules.add(new LengthRule(8, 64));
        rules.add(new CharacterRule(EnglishCharacterData.UpperCase, 1));
        rules.add(new CharacterRule(EnglishCharacterData.LowerCase, 1));
        rules.add(new CharacterRule(EnglishCharacterData.Digit, 1));
        rules.add(new CharacterRule(EnglishCharacterData.Special, 1));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.Alphabetical, 5, false));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.Numerical, 5, false));
        rules.add(new IllegalSequenceRule(EnglishSequenceData.USQwerty, 5, false));

        PasswordValidator validator = new PasswordValidator(rules);
        RuleResult result = validator.validate(new PasswordData(senha));

        if (!result.isValid()) {
            throw new BusinessValidationException("A nova senha deve conter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.");
        }
    }
}
