package com.carbulab.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.dto.usuario.CreateUsuarioDTO;
import com.carbulab.dto.usuario.UpdateUsuarioDTO;
import com.carbulab.exception.BusinessValidationException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.UsuarioRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public void registrarUsuario(CreateUsuarioDTO data) {
        // Valida duplicação
        if (this.usuarioRepository.findByLoginOrEmail(data.login(), data.email()) != null) {
            throw new BusinessValidationException("Login ou Email já cadastrados.");
        }

        // Criptografa e cria entidade
        Usuario newUser = new Usuario(data.nome_usuario(), data.email(), data.login(), this.criptografarSenha(data.senha()), data.funcao());
        
        this.usuarioRepository.save(newUser);
    }

    public void atualizarUsuario(UpdateUsuarioDTO data) {
        // Busca usuário existente
        Usuario usuario = this.usuarioRepository.findById(data.cod_usuario())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        // Valida se o login já pertence a OUTRO usuário cadastrado
        if (data.login() != null && !data.login().isBlank()) {
            var usuarioComMesmoLogin = this.usuarioRepository.findByLogin(data.login());
            if (usuarioComMesmoLogin.isPresent() && usuarioComMesmoLogin.get().getCod_usuario() != usuario.getCod_usuario()) {
                throw new BusinessValidationException("Este login já está em uso por outro usuário.");
            }
            usuario.setLogin(data.login());
        }

        // Valida se o email já pertence a OUTRO usuário cadastrado
        if (data.email() != null && !data.email().isBlank()) {
            var usuarioComMesmoEmail = this.usuarioRepository.findByEmail(data.email());
            if (usuarioComMesmoEmail.isPresent() && usuarioComMesmoEmail.get().getCod_usuario() != usuario.getCod_usuario()) {
                throw new BusinessValidationException("Este email já está em uso por outro usuário.");
            }
            usuario.setEmail(data.email());
        }

        // Atualiza os dados (se fornecidos)
        if (data.nome_usuario() != null && !data.nome_usuario().isBlank()) { usuario.setNome(data.nome_usuario()); }
        if (data.funcao() != null) { usuario.setFuncao(data.funcao()); }
        if (data.senha() != null && !data.senha().isBlank()) {usuario.setSenha(this.criptografarSenha(data.senha())); }

        this.usuarioRepository.save(usuario);
    }

    private String criptografarSenha(String senha) {
        return new BCryptPasswordEncoder().encode(senha);
    }

    @Transactional
    public void deletarPermanentemente(Long id) {
        try {
            int rows = usuarioRepository.deletarPermanentemente(id);
            if (rows == 0) {
                throw new ResourceNotFoundException("Usuário não encontrado na lixeira para exclusão permanente.");
            }
        } catch (DataIntegrityViolationException e) {
            throw new BusinessValidationException("Não é possível excluir permanentemente este usuário, pois ele possui vínculos com outros dados do sistema.");
        }
    }
	
    @Transactional
    public void restaurar(Long id) {
        usuarioRepository.restoreUsuario(id);
    }

    public java.util.List<Usuario> listarLixeira() {
        return usuarioRepository.findAllDeleted();
    }

}
