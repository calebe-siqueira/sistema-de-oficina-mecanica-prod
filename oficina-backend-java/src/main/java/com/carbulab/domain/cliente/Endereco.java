package com.carbulab.domain.cliente;

import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Classe entidade ENDEREÇO:
 * 
 * - Modelo do banco de dados
 * 
 * Representa diretamente a tabela de endereços no banco de dados,
 * contendo todos os campos dela.
 */
@Table(name = "tb_endereco")
@Entity(name = "Endereco")
@SQLDelete(sql = "UPDATE tb_endereco SET deleted_at = CURRENT_TIMESTAMP WHERE cod_endereco = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Endereco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_endereco")
    private Long cod_endereco;
    @Column(name = "numero")
    private Integer numero;
    @Column(name = "complemento")
    private String complemento;

    // Relação com a tabela tb_cep
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "fk_cod_cep", referencedColumnName = "cod_cep")
    private Cep cep;
}