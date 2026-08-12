package com.carbulab.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.userdetails.UserDetails;

import com.carbulab.domain.usuario.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    UserDetails findByLoginOrEmail(String login, String email);

    // Usados para validar Login e Email no UsuarioService
    Optional<Usuario> findByLogin(String login);
    Optional<Usuario> findByEmail(String email);

    @Modifying
    @Query(value = "DELETE FROM tb_usuario WHERE cod_usuario = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    int deletarPermanentemente(@Param("id") Long id);

    @Modifying
    @Query(value = "UPDATE tb_usuario SET deleted_at = NULL WHERE cod_usuario = :id", nativeQuery = true)
    void restoreUsuario(@Param("id") Long id);

    @Query(value = "SELECT * FROM tb_usuario WHERE deleted_at IS NOT NULL", nativeQuery = true)
    java.util.List<Usuario> findAllDeleted();
}

/**
 * Exemplos de operações que podem ser feitas com este repositório:
 * 
 * save(Usuario usuario) - Salvar ou atualizar um usuario
 * saveAll(List<Usuario> usuarios) - Salvar ou atualizar uma lista de usuarios
 * findById(Long id) - Buscar usuario por ID
 * existsById(Long id) - Verificar se usuario existe por ID
 * findAll() - Buscar todos os usuarios (retorna todas as entidades da tabela)
 * deleteById(Long id) - Excluir usuario por ID
 * delete(Usuario usuario) - Excluir um usuario
 * 
 * findByNome(String nome) - Buscar usuarios por nome (se definido na entidade)
 * findByEmail(String email) - Buscar usuarios por email (se definido na entidade)
 * findByLogin(String login) - Buscar usuarios por login (se definido na entidade)
 * findBySenha(String senha) - Buscar usuarios por senha (se definido na entidade)
 * findByFuncao(UsuarioFuncao funcao) - Buscar usuarios por funcao (se definido na entidade)
 * 
 * [...]
 * 
 */
