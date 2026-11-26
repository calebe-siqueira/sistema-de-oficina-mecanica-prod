package com.carbulab.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.Pessoa;
import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.usuario.Usuario;
import com.carbulab.domain.usuario.UsuarioFuncao;
import com.carbulab.dto.cliente.AtivarAcessoClienteDTO;
import com.carbulab.dto.cliente.ResponseAtivarAcessoDTO;
import com.carbulab.dto.cliente.StatusAcessoClienteDTO;
import com.carbulab.exception.ClienteAccessException;
import com.carbulab.exception.ResourceNotFoundException;
import com.carbulab.repositories.ClienteRepository;
import com.carbulab.repositories.UsuarioRepository;

/**
 * Serviço responsável por gerenciar a ativação, desativação e consulta de status
 * de acesso dos clientes ao sistema Carbulab.
 *
 * <p>Após a unificação com {@code tb_pessoa}, quando um cliente ganha acesso ao
 * portal, o novo {@link Usuario} compartilha a <strong>mesma instância</strong>
 * de {@link Pessoa} do cliente. Isso garante que nome e e-mail existam em um
 * único registro no banco — sem duplicação.</p>
 */
@Service
public class ClienteAccessService {

    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    public ClienteAccessService(
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Ativa o acesso do cliente ao sistema.
     *
     * <p>O {@link Usuario} criado compartilha a {@link Pessoa} do cliente
     * (via {@code fk_cod_pessoa}), garantindo unicidade de e-mail no banco.
     * Nenhum novo registro em {@code tb_pessoa} é criado — o usuário aponta
     * para o mesmo registro já existente.</p>
     */
    @Transactional
    public ResponseAtivarAcessoDTO ativarAcesso(Long clienteId, AtivarAcessoClienteDTO dto) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + clienteId));

        String email = cliente.getEmail();
        if (email == null || email.trim().isBlank()) {
            throw new ClienteAccessException("Não é possível ativar o acesso: o cliente não possui e-mail cadastrado.");
        }
        email = email.trim();

        // Verifica se já existe um usuário ativo vinculado a este cliente
        Optional<Usuario> usuarioAtivo = usuarioRepository.findByClienteId(clienteId)
                .filter(u -> u.getDeletedAt() == null);
        if (usuarioAtivo.isEmpty()) {
            usuarioAtivo = usuarioRepository.findByEmailAndFuncao(email, UsuarioFuncao.CLIENTE)
                    .filter(u -> u.getDeletedAt() == null);
        }
        if (usuarioAtivo.isPresent()) {
            throw new ClienteAccessException("Este cliente já possui acesso ativo ao sistema.");
        }

        // Define a senha
        String senhaPlana;
        boolean senhaGeradaAutomaticamente = false;
        if (dto != null && dto.senha() != null && !dto.senha().trim().isBlank()) {
            senhaPlana = dto.senha().trim();
        } else {
            senhaPlana = gerarSenhaTemporariaSegura();
            senhaGeradaAutomaticamente = true;
        }
        String senhaCriptografada = passwordEncoder.encode(senhaPlana);

        // Verifica se já existe um registro (mesmo que desativado/na lixeira) para este cliente
        Optional<Usuario> usuarioExistente = usuarioRepository.findAnyByClienteId(clienteId);
        if (usuarioExistente.isEmpty()) {
            usuarioExistente = usuarioRepository.findAnyByEmailAndFuncaoCliente(email);
        }

        if (usuarioExistente.isPresent()) {
            // Reativa o registro existente em tb_usuario
            // O e-mail NÃO precisa ser atualizado em tb_pessoa: já está lá via a mesma Pessoa
            Long usuarioId = usuarioExistente.get().getCodUsuario();
            usuarioRepository.reativarUsuarioCliente(usuarioId, senhaCriptografada, cliente.getNome(), clienteId);
        } else {
            // Cria um novo usuário compartilhando a Pessoa do cliente
            // Isso evita criar um novo registro em tb_pessoa — o e-mail já existe lá
            Pessoa pessoaCliente = cliente.getPessoa();
            Usuario novoUsuario = new Usuario(pessoaCliente, null, senhaCriptografada, clienteId);
            novoUsuario.setUltimaAlteracaoSenha(LocalDateTime.now());
            usuarioRepository.save(novoUsuario);
        }

        // Dispara o e-mail de credenciais
        boolean emailEnviado = emailService.enviarCredenciaisPrimeiroAcesso(
                email, cliente.getNome(), email, senhaPlana);

        String mensagem = emailEnviado
                ? "Acesso ativado com sucesso! As credenciais foram enviadas para o e-mail do cliente."
                : "Acesso ativado com sucesso. Não foi possível enviar o e-mail automaticamente (verifique o servidor SMTP).";

        return new ResponseAtivarAcessoDTO(
                email,
                senhaGeradaAutomaticamente ? senhaPlana : null,
                emailEnviado,
                mensagem);
    }

    /**
     * Desativa o acesso do cliente ao sistema (soft-delete no usuário vinculado).
     */
    @Transactional
    public void desativaAcesso(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + clienteId));

        String email = cliente.getEmail();
        Usuario usuario = usuarioRepository.findByClienteId(clienteId)
                .filter(u -> u.getDeletedAt() == null)
                .or(() -> (email != null && !email.trim().isBlank())
                        ? usuarioRepository.findByEmailAndFuncao(email.trim(), UsuarioFuncao.CLIENTE)
                                .filter(u -> u.getDeletedAt() == null)
                        : Optional.empty())
                .orElseThrow(() -> new ResourceNotFoundException("O cliente não possui acesso ativo ao sistema."));

        usuario.setDeletedAt(LocalDateTime.now());
        usuarioRepository.delete(usuario);
        usuarioRepository.flush();
    }

    /**
     * Consulta se o cliente possui acesso ativo ao sistema.
     */
    @Transactional(readOnly = true)
    public StatusAcessoClienteDTO verificarStatusAcesso(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com ID: " + clienteId));

        String email = cliente.getEmail();

        Optional<Usuario> usuarioOpt = usuarioRepository.findByClienteId(clienteId)
                .filter(u -> u.getDeletedAt() == null);
        if (usuarioOpt.isEmpty() && email != null && !email.trim().isBlank()) {
            usuarioOpt = usuarioRepository.findByEmailAndFuncao(email.trim(), UsuarioFuncao.CLIENTE)
                    .filter(u -> u.getDeletedAt() == null);
        }

        if (usuarioOpt.isPresent()) {
            Usuario u = usuarioOpt.get();
            String login = (u.getLogin() != null && !u.getLogin().trim().isBlank()) ? u.getLogin() : u.getEmail();
            return new StatusAcessoClienteDTO(true, login, u.getEmail());
        }

        return new StatusAcessoClienteDTO(false, null, email);
    }

    /**
     * Gera uma senha temporária aleatória de 10 caracteres com letras, números e símbolo.
     */
    private String gerarSenhaTemporariaSegura() {
        String maiusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String minusculas = "abcdefghijkmnopqrstuvwxyz";
        String numeros = "23456789";
        String simbolos = "!@#$%&*";

        StringBuilder sb = new StringBuilder();
        sb.append(maiusculas.charAt(random.nextInt(maiusculas.length())));
        sb.append(minusculas.charAt(random.nextInt(minusculas.length())));
        sb.append(numeros.charAt(random.nextInt(numeros.length())));
        sb.append(simbolos.charAt(random.nextInt(simbolos.length())));

        String todos = maiusculas + minusculas + numeros + simbolos;
        for (int i = 4; i < 10; i++) {
            sb.append(todos.charAt(random.nextInt(todos.length())));
        }

        // Embaralha para não seguir padrão previsível
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}
