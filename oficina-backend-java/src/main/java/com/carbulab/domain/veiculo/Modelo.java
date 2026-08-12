package com.carbulab.domain.veiculo;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

@Entity(name = "Modelo")
@Table(name = "tb_modelo")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "codModelo")
public class Modelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("cod_modelo")
    private Integer codModelo;

    @JsonProperty("nome_modelo")
    private String nomeModelo;

    @ManyToOne
    @JoinColumn(name = "fk_cod_montadora")
    private Montadora montadora;
}
