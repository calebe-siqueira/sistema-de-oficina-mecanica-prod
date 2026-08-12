package com.carbulab.domain.veiculo;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;

@Entity(name = "Montadora")
@Table(name = "tb_montadora")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "codMontadora")
public class Montadora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("cod_montadora")
    private Integer codMontadora;

    @JsonProperty("nome_montadora")
    private String nomeMontadora;
}
