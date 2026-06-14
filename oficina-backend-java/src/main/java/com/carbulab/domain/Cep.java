package com.carbulab.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity(name = "Cep")
@Table(name = "tb_cep")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cep {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cod_cep;
    private String cep;
    private String uf;
    private String cidade;
    private String bairro;
    private String logradouro;
}