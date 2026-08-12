package com.carbulab.domain.cliente;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Classe entidade CEP:
 * 
 * - Modelo do banco de dados
 * 
 * Representa diretamente a tabela de CEPs no banco de dados.
 * 
 * Por ser uma tabela auxiliar, não possui relação com clientes,
 * veículos ou qualquer outra tabela do sistema.
 * 
 * Por padrão, não é necessário expor essa classe diretamente
 * para o mundo externo, pois ela é utilizada apenas internamente pelo sistema.
 */
@Table(name = "tb_cep")
@Entity(name = "Cep")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cep {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_cep")
    private Long cod_cep;
    @Column(name = "cep")
    private String cep;
    @Column(name = "uf")
    private String uf;
    @Column(name = "cidade")
    private String cidade;
    @Column(name = "bairro")
    private String bairro;
    @Column(name = "logradouro")
    private String logradouro;
}