package com.carbulab.service;

import com.carbulab.domain.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private JdbcTemplate db;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // Método para buscar usuário pelo Login (Usado na autenticação)
    public Optional<Usuario> buscarPorLogin(String login) {
        String sql = "SELECT * FROM tb_usuario WHERE login = ? OR email = ?";
        try {
            Usuario usuario = db.queryForObject(sql, new UsuarioRowMapper(), login, login);
            return Optional.ofNullable(usuario);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    // Método para criar um novo usuário (Exemplo de lógica que saiu do antigo ManipulacaoDeDados)
    public void salvarUsuario(Usuario usuario) {
        String sql = "INSERT INTO tb_usuario (nome_usuario, email, login, senha, funcao) VALUES (?, ?, ?, ?, ?)";
        // Criptografa a senha antes de salvar
        String senhaHash = encoder.encode(usuario.getSenha());
        
        db.update(sql, 
            usuario.getNome(), 
            usuario.getEmail(), 
            usuario.getLogin(), 
            senhaHash, 
            usuario.getFuncao()
        );
    }

    // Mapeia o resultado do Banco (ResultSet) para o Objeto Usuario
    private static class UsuarioRowMapper implements RowMapper<Usuario> {
        @Override
        public Usuario mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new Usuario(
                rs.getInt("cod_usuario"),
                rs.getString("nome_usuario"),
                rs.getString("email"),
                rs.getString("login"),
                rs.getString("senha"), // Hash
                rs.getString("funcao")
            );
        }
    }
}