package com.carbulab.dto.veiculo;

import com.carbulab.domain.cliente.Cliente;
import com.carbulab.domain.veiculo.Veiculo;

public record ResponseVeiculoDetailsDTO(
    ResponseVeiculoDTO veiculo,
    ClienteDetailsDTO cliente
) {
    public record ClienteDetailsDTO(
        long cod_cliente,
        String nome_cliente,
        String celular
    ) {
        public ClienteDetailsDTO(Cliente c) {
            this(c.getCod_cliente(), c.getNome(), c.getCelular());
        }
    }

    public ResponseVeiculoDetailsDTO(Veiculo v, Cliente c) {
        this(new ResponseVeiculoDTO(v), c != null ? new ClienteDetailsDTO(c) : null);
    }
}
