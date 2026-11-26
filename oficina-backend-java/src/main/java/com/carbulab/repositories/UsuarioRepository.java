package com.carbulab.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;

import com.carbulab.domain.usuario.Usuario;
import com.carbulab.domain.usuario.UsuarioFuncao;

/**
 * Repositório principal para {@link Usuario}.
 *
 * <p>Após a unificação com {@code tb_pessoa}, os campos {@code email} e
 * {@code nome_usuario} foram removidos de {@code tb_usuario} e passaram a
 * residir em {@code tb_pessoa}. As queries abaixo fazem {@code JOIN} ou usam
 * o relacionamento {@code u.pessoa.email} do JPQL para manter a semântica
 * original sem expor detalhes do modelo relacional aos chamadores.</p>
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // -------------------------------------------------------------------------
    // Autenticação / Spring Security
    // -------------------------------------------------------------------------

    /**
     * Busca um usuário cujo login ou e-mail (na tb_pessoa) coincida.
     * Usado pelo Spring Security (loadUserByUsername) e pelo filtro JWT.
     */
    @Query("""
            SELECT u FROM Usuario u
            JOIN u.pessoa p
            WHERE u.deletedAt IS NULL
              AND (LOWER(u.login) = LOWER(:login) OR LOWER(p.email) = LOWER(:email))
            """)
    UserDetails findByLoginOrEmail(@Param("login") String login, @Param("email") String email);

    // -------------------------------------------------------------------------
    // Buscas por login
    // -------------------------------------------------------------------------

    Optional<Usuario> findByLogin(String login);

    Optional<Usuario> findByLoginIgnoreCase(String login);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM Usuario u WHERE LOWER(u.login) = LOWER(:login)")
    boolean existsByLoginIgnoreCase(@Param("login") String login);

    // -------------------------------------------------------------------------
    // Buscas por e-mail (navegam por u.pessoa.email)
    // -------------------------------------------------------------------------

    @Query("SELECT u FROM Usuario u JOIN u.pessoa p WHERE LOWER(p.email) = LOWER(:email) AND u.deletedAt IS NULL")
    Optional<Usuario> findByEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT u FROM Usuario u JOIN u.pessoa p WHERE LOWER(p.email) = LOWER(:email) AND u.funcao = :funcao AND u.deletedAt IS NULL")
    Optional<Usuario> findByEmailAndFuncao(@Param("email") String email, @Param("funcao") UsuarioFuncao funcao);

    @Query("SELECT u FROM Usuario u JOIN u.pessoa p WHERE LOWER(p.email) = LOWER(:email)")
    Optional<Usuario> findByEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM Usuario u JOIN u.pessoa p WHERE LOWER(p.email) = LOWER(:email)")
    boolean existsByEmailIgnoreCase(@Param("email") String email);

    /**
     * Busca por login OR e-mail, inclusive usuários deletados (soft-delete).
     * Usado em recuperação de senha.
     */
    @Query("""
            SELECT u FROM Usuario u
            JOIN u.pessoa p
            WHERE LOWER(u.login) = LOWER(:login) OR LOWER(p.email) = LOWER(:email)
            """)
    Optional<Usuario> findByLoginIgnoreCaseOrEmailIgnoreCase(@Param("login") String login, @Param("email") String email);

    // -------------------------------------------------------------------------
    // Buscas por cliente vinculado (fk_cod_cliente)
    // -------------------------------------------------------------------------

    @Query(value = "SELECT * FROM tb_usuario WHERE fk_cod_cliente = :clienteId AND deleted_at IS NULL LIMIT 1", nativeQuery = true)
    Optional<Usuario> findByClienteId(@Param("clienteId") Long clienteId);

    @Query(value = "SELECT * FROM tb_usuario WHERE fk_cod_cliente = :clienteId ORDER BY CASE WHEN deleted_at IS NULL THEN 0 ELSE 1 END, cod_usuario DESC LIMIT 1", nativeQuery = true)
    Optional<Usuario> findAnyByClienteId(@Param("clienteId") Long clienteId);

    /**
     * Busca qualquer usuário (inclusive deletado) com função CLIENTE e o e-mail informado.
     */
    @Query(value = """
            SELECT u.* FROM tb_usuario u
            JOIN tb_pessoa p ON u.fk_cod_pessoa = p.cod_pessoa
            WHERE LOWER(p.email) = LOWER(:email)
              AND u.funcao = 'CLIENTE'
            ORDER BY CASE WHEN u.deleted_at IS NULL THEN 0 ELSE 1 END, u.cod_usuario DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<Usuario> findAnyByEmailAndFuncaoCliente(@Param("email") String email);

    // -------------------------------------------------------------------------
    // Contagem utilitária
    // -------------------------------------------------------------------------

    @Query(value = """
            SELECT COUNT(*) FROM tb_usuario u
            JOIN tb_pessoa p ON u.fk_cod_pessoa = p.cod_pessoa
            WHERE LOWER(p.email) = LOWER(:email) OR LOWER(u.login) = LOWER(:email)
            """, nativeQuery = true)
    long countAnyByEmailOrLogin(@Param("email") String email);

    // -------------------------------------------------------------------------
    // Reativação de usuário cliente
    // -------------------------------------------------------------------------

    /**
     * Reativa um usuário cliente, atualizando senha, nome, fk_cod_cliente e
     * removendo o soft-delete. O e-mail é atualizado na tb_pessoa via UPDATE
     * separado (ver {@link #atualizarEmailPessoa}).
     */
    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE tb_usuario u
            JOIN tb_pessoa p ON u.fk_cod_pessoa = p.cod_pessoa
            SET u.deleted_at = NULL,
                u.senha = :senha,
                p.nome = :nome,
                u.fk_cod_cliente = :clienteId,
                u.funcao = 'CLIENTE',
                u.ultima_alteracao_senha = CURRENT_TIMESTAMP
            WHERE u.cod_usuario = :id
            """, nativeQuery = true)
    void reativarUsuarioCliente(
            @Param("id") Long id,
            @Param("senha") String senha,
            @Param("nome") String nome,
            @Param("clienteId") Long clienteId);

    /**
     * Atualiza o e-mail na tb_pessoa via JOIN com tb_usuario.
     * Chamado junto com {@link #reativarUsuarioCliente} quando o e-mail deve mudar.
     */
    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE tb_pessoa p
            JOIN tb_usuario u ON u.fk_cod_pessoa = p.cod_pessoa
            SET p.email = :email
            WHERE u.cod_usuario = :usuarioId
            """, nativeQuery = true)
    void atualizarEmailPessoa(@Param("usuarioId") Long usuarioId, @Param("email") String email);

    // -------------------------------------------------------------------------
    // Atualização de campos de auditoria
    // -------------------------------------------------------------------------

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Usuario u SET u.ultimoAcesso = :agora WHERE u.codUsuario = :id")
    void atualizarUltimoAcesso(@Param("id") Long id, @Param("agora") java.time.LocalDateTime agora);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Usuario u SET u.ultimaAlteracaoSenha = :agora WHERE u.codUsuario = :id")
    void atualizarUltimaAlteracaoSenha(@Param("id") Long id, @Param("agora") java.time.LocalDateTime agora);

    // -------------------------------------------------------------------------
    // Soft-delete / Lixeira
    // -------------------------------------------------------------------------

    @Transactional
    @Modifying
    @Query(value = "DELETE FROM tb_usuario WHERE cod_usuario = :id AND deleted_at IS NOT NULL", nativeQuery = true)
    int deletarPermanentemente(@Param("id") Long id);

    @Transactional
    @Modifying
    @Query(value = "UPDATE tb_usuario SET deleted_at = NULL WHERE cod_usuario = :id", nativeQuery = true)
    void restoreUsuario(@Param("id") Long id);

    @Query(value = "SELECT * FROM tb_usuario WHERE deleted_at IS NOT NULL", nativeQuery = true)
    List<Usuario> findAllDeleted();
}
