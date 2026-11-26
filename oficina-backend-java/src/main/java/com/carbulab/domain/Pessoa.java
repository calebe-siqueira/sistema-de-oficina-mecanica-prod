package com.carbulab.domain;

import com.carbulab.exception.BusinessValidationException;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidade central que representa a identidade única de uma pessoa no sistema.
 *
 * <p>
 * Serve como <strong>fonte única de verdade</strong> para {@code nome} e
 * {@code email},
 * eliminando a duplicidade que existia entre {@code tb_cliente} e
 * {@code tb_usuario}.
 * Tanto {@link com.carbulab.domain.cliente.Cliente} quanto
 * {@link com.carbulab.domain.usuario.Usuario} referenciam esta entidade via
 * {@code @OneToOne}, garantindo que um mesmo e-mail exista em apenas um
 * registro no banco.
 * </p>
 *
 * <p>
 * Regras de unicidade mantidas diretamente pela constraint
 * {@code UNIQUE} em {@code tb_pessoa.email} (nível de banco de dados),
 * o que impede duplicação mesmo em cenários de concorrência.
 * </p>
 */
@Entity
@Table(name = "tb_pessoa")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "codPessoa")
public class Pessoa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "cod_pessoa")
	private Long codPessoa;

	@Column(name = "nome", nullable = false)
	private String nome;

	@Column(name = "email", unique = true)
	private String email;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	/**
	 * Construtor para novas pessoas (sem ID).
	 */
	public Pessoa(String nome, String email) {
		this.setNome(nome);
		this.setEmail(email);
	}

	// -------------------------------------------------------------------------
	// Setters com validação de negócio
	// -------------------------------------------------------------------------

	/**
	 * Define o nome, convertendo strings vazias para {@code null}.
	 */
	public void setNome(String nome) {
		if (nome != null && nome.trim().isEmpty()) {
			nome = null;
		}
		this.nome = nome;
	}

	/**
	 * Define o e-mail com validação básica de formato.
	 * Strings vazias são convertidas para {@code null}.
	 */
	public void setEmail(String email) { // Não obrigatório
		if (email != null) {
			if (!email.trim().isEmpty()) {
				String trimmed = email.trim().toLowerCase();
				if (trimmed.length() < 11 || !(trimmed.contains("@") && trimmed.contains("."))) {
					throw new BusinessValidationException("E-mail inválido.");
				}
				this.email = trimmed;
			} else {
				this.email = null;
			}
		} else {
			this.email = null;
		}
	}
}
