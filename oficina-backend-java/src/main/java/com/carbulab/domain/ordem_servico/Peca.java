package com.carbulab.domain.ordem_servico;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
@Entity
@Table(name = "tb_peca")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Peca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer cod_peca;

    @Column(name = "nome_peca", nullable = false, unique = true)
    private String nomePeca;
}
