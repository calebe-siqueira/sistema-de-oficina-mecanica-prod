package com.carbulab.domain;

import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity(name = "Endereco")
@Table(name = "tb_endereco")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Endereco {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cod_endereco;
    private Integer numero;
    private String complemento;

    // Relação com a tabela tb_cep
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "fk_cod_cep", referencedColumnName = "cod_cep")
    private Cep cep;
}