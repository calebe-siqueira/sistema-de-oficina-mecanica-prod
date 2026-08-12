package com.carbulab.domain.usuario;

import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.carbulab.domain.Pessoa;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Table(name = "tb_usuario")
@Entity(name = "Usuario")
@SQLDelete(sql = "UPDATE tb_usuario SET deleted_at = CURRENT_TIMESTAMP WHERE cod_usuario = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "cod_usuario", callSuper = false) // Gera equals e hashCode apenas com base no cod_usuario, ignorando os campos da superclasse Pessoa;
@AttributeOverride(name = "nome", column = @Column(name = "nome_usuario")) // Sobrescreve o campo nome da superclasse Pessoa, renomeando para "nome_usuario";
public class Usuario extends Pessoa implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long cod_usuario;
    private String login;
    private String senha; // Em produção, isso armazena o Hash BCrypt
    @Enumerated(EnumType.STRING)
    private UsuarioFuncao funcao;

    // Construtor completo
    public Usuario(long cod_usuario, String nome, String email, String login, String senha, UsuarioFuncao funcao) {
        super(nome, email);
        this.setCod_usuario(cod_usuario);
        this.setLogin(login);
        this.setSenha(senha);
        this.setFuncao(funcao);
    }
    
    // Construtor sem ID (para novos cadastros)
    public Usuario(String nome, String email, String login, String senha, UsuarioFuncao funcao) {
        super(nome, email);
        this.setLogin(login);
        this.setSenha(senha);
        this.setFuncao(funcao);
    }

    // Implementação dos métodos de UserDetails
    @Override
    public String getUsername() {
        return this.login;
    }

    @Override
    public String getPassword() {
        return this.senha;
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
        return true;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if(this.funcao == UsuarioFuncao.ADMIN) {
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else if(this.funcao == UsuarioFuncao.MECANICO) {
            return List.of(new SimpleGrantedAuthority("ROLE_STAFF"));
        } else if(this.funcao == UsuarioFuncao.CLIENTE) {
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return Collections.emptyList();
    }

}