package com.carbulab.domain.usuario;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.carbulab.domain.Pessoa;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidade que representa um usuário do sistema.
 *
 * <p>Dados de identidade (nome e e-mail) são delegados à entidade
 * {@link Pessoa}, que é a <strong>fonte única de verdade</strong> e garante a
 * unicidade global de e-mail entre clientes e usuários.</p>
 *
 * <p>Um usuário do tipo {@code CLIENTE} compartilha a mesma instância de
 * {@link Pessoa} com o respectivo registro em {@link com.carbulab.domain.cliente.Cliente},
 * de modo que qualquer alteração de nome ou e-mail reflete imediatamente
 * em ambos os contextos.</p>
 */
@Entity(name = "Usuario")
@Table(name = "tb_usuario")
@SQLDelete(sql = "UPDATE tb_usuario SET deleted_at = CURRENT_TIMESTAMP WHERE cod_usuario = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "codUsuario")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_usuario")
    private long codUsuario;

    /**
     * Identidade compartilhada: nome e e-mail deste usuário.
     * {@code CascadeType.PERSIST} garante que uma nova {@link Pessoa} seja
     * persistida junto ao usuário quando ainda não existir no banco.
     * {@code MERGE} propaga atualizações de nome/email automaticamente.
     */
    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "fk_cod_pessoa", referencedColumnName = "cod_pessoa", nullable = false)
    private Pessoa pessoa;

    @Column(name = "fk_cod_cliente")
    private Long fkCodCliente;

    private String login;

    private String senha;

    @Enumerated(EnumType.STRING)
    private UsuarioFuncao funcao;

    @Column(name = "ultimo_acesso")
    private LocalDateTime ultimoAcesso;

    @Column(name = "ultima_alteracao_senha")
    private LocalDateTime ultimaAlteracaoSenha;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // -------------------------------------------------------------------------
    // Construtores semânticos
    // -------------------------------------------------------------------------

    /**
     * Cria um usuário administrativo ou mecânico (sem cliente vinculado).
     *
     * @param nome   nome completo
     * @param email  endereço de e-mail (único no sistema)
     * @param login  login de acesso
     * @param senha  senha já criptografada
     * @param funcao papel do usuário no sistema
     */
    public Usuario(String nome, String email, String login, String senha, UsuarioFuncao funcao) {
        this.pessoa = new Pessoa(nome, email);
        this.setLogin(login);
        this.setSenha(senha);
        this.funcao = funcao;
    }

    public Usuario(Long codUsuario, String nome, String email, String login, String senha, UsuarioFuncao funcao) {
        this.codUsuario = codUsuario;
        this.pessoa = new Pessoa(nome, email);
        this.setLogin(login);
        this.setSenha(senha);
        this.funcao = funcao;
    }

    /**
     * Cria um usuário do tipo CLIENTE vinculado a um registro de cliente existente.
     * Recebe a {@link Pessoa} já persistida do cliente para compartilhá-la.
     *
     * @param pessoa       instância de Pessoa do cliente (já existente ou nova)
     * @param login        login de acesso (pode ser {@code null} para clientes que usam e-mail)
     * @param senha        senha já criptografada
     * @param fkCodCliente ID do cliente vinculado
     */
    public Usuario(Pessoa pessoa, String login, String senha, Long fkCodCliente) {
        this.pessoa = pessoa;
        this.setLogin(login);
        this.setSenha(senha);
        this.funcao = UsuarioFuncao.CLIENTE;
        this.fkCodCliente = fkCodCliente;
    }

    // -------------------------------------------------------------------------
    // Delegação para Pessoa — mantém a API pública sem quebrar chamadores
    // -------------------------------------------------------------------------

    /** Retorna o nome do usuário (delegado a {@link Pessoa}). */
    public String getNome() {
        return pessoa != null ? pessoa.getNome() : null;
    }

    /** Define o nome do usuário (delegado a {@link Pessoa}). */
    public void setNome(String nome) {
        if (pessoa == null) {
            pessoa = new Pessoa();
        }
        pessoa.setNome(nome);
    }

    /** Retorna o e-mail do usuário (delegado a {@link Pessoa}). */
    public String getEmail() {
        return pessoa != null ? pessoa.getEmail() : null;
    }

    /** Define o e-mail do usuário (delegado a {@link Pessoa}). */
    public void setEmail(String email) {
        if (pessoa == null) {
            pessoa = new Pessoa();
        }
        pessoa.setEmail(email);
    }

    // -------------------------------------------------------------------------
    // Setter com validação
    // -------------------------------------------------------------------------

    public void setLogin(String login) {
        this.login = (login != null && login.trim().isEmpty()) ? null : login;
    }

    public void setSenha(String senha) {
        this.senha = (senha != null && senha.trim().isEmpty()) ? null : senha;
    }

    // -------------------------------------------------------------------------
    // Compatibilidade: aliases para campos renomeados
    // -------------------------------------------------------------------------

    /** @deprecated Use {@link #getCodUsuario()} */
    @Deprecated
    public long getCod_usuario() {
        return codUsuario;
    }

    /** @deprecated Use {@link #setCodUsuario(long)} */
    @Deprecated
    public void setCod_usuario(long id) {
        this.codUsuario = id;
    }

    /** @deprecated Use {@link #getFkCodCliente()} */
    @Deprecated
    public Long getFk_cod_cliente() {
        return fkCodCliente;
    }

    /** @deprecated Use {@link #setFkCodCliente(Long)} */
    @Deprecated
    public void setFk_cod_cliente(Long id) {
        this.fkCodCliente = id;
    }

    // -------------------------------------------------------------------------
    // UserDetails
    // -------------------------------------------------------------------------

    @Override
    public String getUsername() {
        return login != null ? login : getEmail();
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return deletedAt == null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (funcao == UsuarioFuncao.ADMIN) {
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else if (funcao == UsuarioFuncao.MECANICO) {
            return List.of(
                new SimpleGrantedAuthority("ROLE_MECANICO"),
                new SimpleGrantedAuthority("ROLE_STAFF")
            );
        } else if (funcao == UsuarioFuncao.CLIENTE) {
            return List.of(
                new SimpleGrantedAuthority("ROLE_CLIENTE"),
                new SimpleGrantedAuthority("ROLE_USER")
            );
        }
        return Collections.emptyList();
    }
}