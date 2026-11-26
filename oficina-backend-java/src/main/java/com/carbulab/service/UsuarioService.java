package com.carbulab.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.Pessoa;
import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.usuario.CreateUsuarioDTO;
import com.carbulab.dto.usuario.UpdateUsuarioDTO;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.PessoaRepository;
import com.carbulab.repositories.UsuarioRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Serviço para gerenciamento de usuários administrativos e mecânicos.
 *
 * <p>Após a unificação com {@code tb_pessoa}, os dados de nome e e-mail
 * são gerenciados pela entidade {@link Pessoa}, que é a fonte única de verdade.
 * Este serviço coordena as operações de forma transacional, garantindo que
 * qualquer alteração de e-mail em {@code tb_pessoa} reflita imediatamente
 * no login do usuário.</p>
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PessoaRepository pessoaRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, PessoaRepository pessoaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.pessoaRepository = pessoaRepository;
    }

    /**
     * Registra um novo usuário (ADMIN ou MECÂNICO).
     * Valida unicidade de login e e-mail antes de persistir.
     */
    @Transactional
    public void registrarUsuario(CreateUsuarioDTO data) {
        // Valida unicidade de login
        if (data.login() != null && !data.login().isBlank()
                && usuarioRepository.existsByLoginIgnoreCase(data.login())) {
            throw new BusinessValidationException("Este login já está cadastrado.");
        }

        // Valida unicidade de e-mail (na tb_pessoa = único global)
        if (pessoaRepository.existsByEmailIgnoreCase(data.email())) {
            throw new BusinessValidationException("Este e-mail já está cadastrado no sistema.");
        }

        Usuario novoUsuario = new Usuario(
                data.nome_usuario(),
                data.email(),
                data.login(),
                criptografarSenha(data.senha()),
                data.funcao());
        novoUsuario.setUltimaAlteracaoSenha(java.time.LocalDateTime.now());

        usuarioRepository.save(novoUsuario);
    }

    /**
     * Atualiza os dados de um usuário existente (suporta atualização parcial com distinção entre campo omitido e {@code null} explícito).
     * Valida unicidade de login e e-mail excluindo o próprio registro.
     */
    @Transactional
    public void atualizarUsuario(UpdateUsuarioDTO data) {
        Usuario usuario = usuarioRepository.findById(data.cod_usuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        // Validar e atualizar login (campo anulável)
        if (data.login().isPresent()) {
            String novoLogin = data.login().get();
            if (novoLogin != null && !novoLogin.isBlank()) {
                usuarioRepository.findByLogin(novoLogin).ifPresent(outro -> {
                    if (outro.getCodUsuario() != usuario.getCodUsuario()) {
                        throw new BusinessValidationException("Este login já está em uso por outro usuário.");
                    }
                });
                usuario.setLogin(novoLogin);
            } else {
                usuario.setLogin(null);
            }
        }

        // Validar e atualizar e-mail (obrigatório e único global via tb_pessoa)
        if (data.email().isPresent()) {
            String novoEmailRaw = data.email().get();
            if (novoEmailRaw == null || novoEmailRaw.isBlank()) {
                throw new BusinessValidationException("E-mail do usuário é obrigatório.");
            }
            String novoEmail = novoEmailRaw.trim().toLowerCase();
            Pessoa pessoaAtual = usuario.getPessoa();
            if (pessoaRepository.existsByEmailIgnoreCaseAndCodPessoaNot(novoEmail, pessoaAtual.getCodPessoa())) {
                throw new BusinessValidationException("Este e-mail já está em uso por outro usuário ou cliente.");
            }
            usuario.setEmail(novoEmail);
        }

        // Validar e atualizar nome
        if (data.nome_usuario().isPresent()) {
            String novoNome = data.nome_usuario().get();
            if (novoNome == null || novoNome.isBlank()) {
                throw new BusinessValidationException("Nome do usuário é obrigatório.");
            }
            usuario.setNome(novoNome);
        }

        // Validar e atualizar função
        if (data.funcao().isPresent()) {
            if (data.funcao().get() == null) {
                throw new BusinessValidationException("Função do usuário é obrigatória.");
            }
            usuario.setFuncao(data.funcao().get());
        }

        // Atualizar senha (quando omitida, nula ou vazia, mantém a senha atual)
        if (data.senha().isPresent()) {
            String novaSenha = data.senha().get();
            if (novaSenha != null && !novaSenha.isBlank()) {
                usuario.setSenha(criptografarSenha(novaSenha));
                usuario.setUltimaAlteracaoSenha(java.time.LocalDateTime.now());
            }
        }

        usuarioRepository.save(usuario);
    }

    /**
     * Remove permanentemente um usuário da lixeira.
     */
    @Transactional
    public void deletarPermanentemente(Long id) {
        try {
            int rows = usuarioRepository.deletarPermanentemente(id);
            if (rows == 0) {
                throw new ResourceNotFoundException("Usuário não encontrado na lixeira para exclusão permanente.");
            }
        } catch (DataIntegrityViolationException e) {
            throw new BusinessValidationException(
                    "Não é possível excluir permanentemente este usuário, pois ele possui vínculos com outros dados do sistema.");
        }
    }

    /**
     * Restaura um usuário da lixeira (soft-delete reverso).
     */
    @Transactional
    public void restaurar(Long id) {
        usuarioRepository.restoreUsuario(id);
    }

    /**
     * Retorna todos os usuários na lixeira (soft-deleted).
     */
    public java.util.List<Usuario> listarLixeira() {
        return usuarioRepository.findAllDeleted();
    }

    // -------------------------------------------------------------------------
    // Utilitários privados
    // -------------------------------------------------------------------------

    private String criptografarSenha(String senha) {
        return new BCryptPasswordEncoder().encode(senha);
    }
}
