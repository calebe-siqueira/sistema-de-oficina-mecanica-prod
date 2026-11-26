package com.carbulab.infra.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.domain.usuario.UsuarioFuncao;
import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.veiculo.Veiculo;
import com.carbulab.domain.ordem_servico.OrdemServico;
import com.carbulab.repositories.ClienteRepository;
import com.carbulab.repositories.VeiculoRepository;
import com.carbulab.repositories.OrdemServicoRepository;
import com.carbulab.repositories.UsuarioRepository;

@Component("securityRules")
public class SecurityRules {

    private final ClienteRepository clienteRepository;
    private final VeiculoRepository veiculoRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final UsuarioRepository usuarioRepository;

    public SecurityRules(
            ClienteRepository clienteRepository,
            VeiculoRepository veiculoRepository,
            OrdemServicoRepository ordemServicoRepository,
            UsuarioRepository usuarioRepository) {
        this.clienteRepository = clienteRepository;
        this.veiculoRepository = veiculoRepository;
        this.ordemServicoRepository = ordemServicoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Regra ADMIN: Garanta que apenas o ADMIN crie novos usuários.
     * Permita que ele atualize qualquer usuário, exceto se o usuário alvo também for um ADMIN (a não ser que seja ele mesmo).
     * O CLIENTE e o MECANICO não podem atualizar informações de usuários.
     */
    public boolean canUpdateUser(Authentication authentication, Long targetUserId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        
        Usuario loggedUser = (Usuario) authentication.getPrincipal();
        
        // Apenas ADMIN pode atualizar usuários
        if (loggedUser.getFuncao() != UsuarioFuncao.ADMIN) {
            return false;
        }
        
        // Verifica se o alvo é ADMIN
        Usuario targetUser = usuarioRepository.findById(targetUserId).orElse(null);
        if (targetUser == null) {
            return true; // Deixa o controller lidar com o 404
        }
        
        if (targetUser.getFuncao() == UsuarioFuncao.ADMIN) {
            // ADMIN só pode atualizar outro ADMIN se for ele mesmo
            return loggedUser.getCod_usuario() == targetUser.getCod_usuario();
        }
        
        return true;
    }

    /**
     * Verifica se o usuário logado é dono do Cliente (verificação direta por ID da FK, com fallback para email)
     */
    public boolean isClienteOwner(Authentication authentication, Long clienteId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;

        Usuario loggedUser = (Usuario) authentication.getPrincipal();

        // Se for ADMIN ou MECANICO, já tem permissão via role na anotação, 
        // mas por garantia podemos retornar true aqui também
        if (loggedUser.getFuncao() == UsuarioFuncao.ADMIN || loggedUser.getFuncao() == UsuarioFuncao.MECANICO) {
            return true;
        }

        if (loggedUser.getFk_cod_cliente() != null) {
            return loggedUser.getFk_cod_cliente().equals(clienteId);
        }

        Cliente cliente = clienteRepository.findById(clienteId).orElse(null);
        if (cliente == null || cliente.getEmail() == null) {
            return false;
        }

        return cliente.getEmail().equalsIgnoreCase(loggedUser.getEmail());
    }

    /**
     * Verifica se o usuário logado é dono do Veiculo
     */
    public boolean isVeiculoOwner(Authentication authentication, Integer veiculoId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;

        Usuario loggedUser = (Usuario) authentication.getPrincipal();

        if (loggedUser.getFuncao() == UsuarioFuncao.ADMIN || loggedUser.getFuncao() == UsuarioFuncao.MECANICO) {
            return true;
        }

        Veiculo veiculo = veiculoRepository.findById(veiculoId).orElse(null);
        if (veiculo == null || veiculo.getCliente() == null) {
            return false;
        }

        if (loggedUser.getFk_cod_cliente() != null) {
            return loggedUser.getFk_cod_cliente().equals(veiculo.getCliente().getCod_cliente());
        }

        if (veiculo.getCliente().getEmail() == null) {
            return false;
        }

        return veiculo.getCliente().getEmail().equalsIgnoreCase(loggedUser.getEmail());
    }

    /**
     * Verifica se o usuário logado é dono da Ordem de Servico
     */
    public boolean isOsOwner(Authentication authentication, Integer osId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;

        Usuario loggedUser = (Usuario) authentication.getPrincipal();

        if (loggedUser.getFuncao() == UsuarioFuncao.ADMIN || loggedUser.getFuncao() == UsuarioFuncao.MECANICO) {
            return true;
        }

        OrdemServico os = ordemServicoRepository.findById(osId).orElse(null);
        if (os == null || os.getVeiculo() == null || os.getVeiculo().getCliente() == null) {
            return false;
        }

        if (loggedUser.getFk_cod_cliente() != null) {
            return loggedUser.getFk_cod_cliente().equals(os.getVeiculo().getCliente().getCod_cliente());
        }

        if (os.getVeiculo().getCliente().getEmail() == null) {
            return false;
        }

        return os.getVeiculo().getCliente().getEmail().equalsIgnoreCase(loggedUser.getEmail());
    }
}
