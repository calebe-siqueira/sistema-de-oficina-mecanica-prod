package com.carbulab.domain.ordem_servico;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
@Entity
@Table(name = "tb_servico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Servico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer cod_servico;

    @Column(name = "nome_servico", nullable = false, unique = true)
    private String nomeServico;
}
