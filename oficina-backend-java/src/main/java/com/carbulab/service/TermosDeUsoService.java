package com.carbulab.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.termo.AceitacaoTermosDeUso;
import com.carbulab.domain.termo.TermoDeUso;
import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.termo.AceitarTermosDTO;
import com.carbulab.dto.termo.ResponseAceitacaoTermosDTO;
import com.carbulab.dto.termo.StatusTermosDTO;
import com.carbulab.dto.termo.TermosDeUsoDTO;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.AceitacaoTermosDeUsoRepository;
import com.carbulab.repositories.TermoDeUsoRepository;

@Service
public class TermosDeUsoService {

    private final TermoDeUsoRepository termoRepository;
    private final AceitacaoTermosDeUsoRepository aceitacaoRepository;

    public TermosDeUsoService(
            TermoDeUsoRepository termoRepository,
            AceitacaoTermosDeUsoRepository aceitacaoRepository) {
        this.termoRepository = termoRepository;
        this.aceitacaoRepository = aceitacaoRepository;
    }

    /**
     * Retorna o termo de uso mais recente cadastrado ou inicializa a versão padrão caso a tabela esteja vazia.
     */
    @Transactional
    public TermoDeUso obterOuInicializarTermoMaisRecente() {
        return termoRepository.findTermoMaisRecente()
                .orElseThrow(() -> new IllegalStateException(
                	"Erro crítico: Nenhum termo de uso ativo foi encontrado no banco de dados. " +
                	"Verifique a carga inicial do sistema."
            ));
    }

    /**
     * Retorna a versão vigente e o conteúdo em markdown dos termos de uso.
     */
    @Transactional(readOnly = true)
    public TermosDeUsoDTO obterTermoAtual() {
        TermoDeUso termo = obterOuInicializarTermoMaisRecente();
        return new TermosDeUsoDTO(termo);
    }

    /**
     * Consulta se o usuário autenticado já aceitou a versão vigente dos termos de uso.
     */
    @Transactional(readOnly = true)
    public StatusTermosDTO obterStatus(Usuario usuario) {
        if (usuario == null) {
            return new StatusTermosDTO(false, null, null, null, null, true);
        }

        TermoDeUso termoAtual = obterOuInicializarTermoMaisRecente();

        Optional<AceitacaoTermosDeUso> ultimaAceitacao = aceitacaoRepository
                .findUltimaPorUsuarioETermo(usuario.getCod_usuario(), termoAtual.getCodTermo());

        if (ultimaAceitacao.isPresent()) {
            AceitacaoTermosDeUso reg = ultimaAceitacao.get();
            boolean aceito = Boolean.TRUE.equals(reg.getAceito());
            return new StatusTermosDTO(
                    aceito,
                    termoAtual.getCodTermo(),
                    termoAtual.getVersaoTermo(),
                    reg.getTermo() != null ? reg.getTermo().getVersaoTermo() : null,
                    reg.getAceitoEm(),
                    !aceito
            );
        }

        return new StatusTermosDTO(
                false,
                termoAtual.getCodTermo(),
                termoAtual.getVersaoTermo(),
                null,
                null,
                true
        );
    }

    /**
     * Registra o aceite ou a recusa dos termos de uso pelo usuário autenticado,
     * persistindo o histórico na tabela tb_aceitacao_termos_de_uso com a FK do termo correspondente.
     */
    @Transactional
    public ResponseAceitacaoTermosDTO registrarAceiteOuRecusa(
            Usuario usuario,
            AceitarTermosDTO dto,
            String enderecoIp,
            String userAgent) {

        if (usuario == null) {
            throw new BusinessValidationException("Usuário não identificado.");
        }

        if (dto == null || dto.getValorAceito() == null) {
            throw new BusinessValidationException("O status de aceitação (aceito ou recusado) deve ser informado.");
        }

        TermoDeUso termo;
        if (dto.versao_termo() != null && !dto.versao_termo().isBlank()) {
            termo = termoRepository.findByVersaoTermo(dto.versao_termo().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Versão dos termos de uso não encontrada: " + dto.versao_termo()));
        } else {
            termo = obterOuInicializarTermoMaisRecente();
        }

        String ipSanitizado = (enderecoIp != null && !enderecoIp.isBlank()) ? enderecoIp.trim() : "0.0.0.0";
        if (ipSanitizado.length() > 45) {
            ipSanitizado = ipSanitizado.substring(0, 45);
        }

        String userAgentSanitizado = userAgent;
        if (userAgentSanitizado != null && userAgentSanitizado.length() > 500) {
            userAgentSanitizado = userAgentSanitizado.substring(0, 500);
        }

        LocalDateTime agora = LocalDateTime.now(ZoneOffset.UTC);

        AceitacaoTermosDeUso aceitacao = new AceitacaoTermosDeUso(
                usuario,
                termo,
                agora,
                ipSanitizado,
                userAgentSanitizado,
                dto.getValorAceito()
        );

        AceitacaoTermosDeUso salvo = aceitacaoRepository.save(aceitacao);

        String mensagem = Boolean.TRUE.equals(dto.getValorAceito())
                ? "Termos de uso aceitos com sucesso!"
                : "Recusa dos termos de uso registrada com sucesso. O acesso aos recursos do sistema permanecerá restrito até a aceitação dos termos.";

        return new ResponseAceitacaoTermosDTO(salvo, mensagem);
    }

    /**
     * Verifica se o usuário aceitou a versão vigente dos termos de uso.
     */
    @Transactional(readOnly = true)
    public boolean isTermosAceitos(Usuario usuario) {
        if (usuario == null) {
            return false;
        }

        Optional<TermoDeUso> termoAtual = termoRepository.findTermoMaisRecente();
        if (termoAtual.isEmpty()) {
            return true;
        }

        Optional<AceitacaoTermosDeUso> ultimaAceitacao = aceitacaoRepository
                .findUltimaPorUsuarioETermo(usuario.getCod_usuario(), termoAtual.get().getCodTermo());

        return ultimaAceitacao.map(a -> Boolean.TRUE.equals(a.getAceito())).orElse(false);
    }
}
