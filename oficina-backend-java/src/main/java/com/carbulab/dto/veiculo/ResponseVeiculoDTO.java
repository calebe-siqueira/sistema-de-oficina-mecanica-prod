package com.carbulab.dto.veiculo;

import com.carbulab.domain.veiculo.Veiculo;
import com.carbulab.domain.veiculo.Carro;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO para resposta de Veículos (Data Transfer Object)
 * 
 * - Usada para enviar dados de veículos ao cliente
 * - Trafega apenas informações necessárias
 */
public record ResponseVeiculoDTO(

		long cod_veiculo,
		@JsonProperty("nome_montadora") String nomeMontadora,
		@JsonProperty("nome_modelo") String nomeModelo,
		Integer ano,
		String placa,
		String cor,
		String combustivel,
		String tipo,
		Long fk_cod_cliente,
		String nome_cliente) {

	public ResponseVeiculoDTO(Veiculo veiculo) {
		this(
				veiculo.getCod_veiculo(),
				veiculo.getModelo() != null && veiculo.getModelo().getMontadora() != null
						? veiculo.getModelo().getMontadora().getNomeMontadora()
						: "", // Montadora
				veiculo.getModelo() != null ? veiculo.getModelo().getNomeModelo() : "", // Modelo
				veiculo.getAno(),
				veiculo.getPlaca(),
				veiculo.getCor(),
				veiculo.getCombustivel(),
				veiculo instanceof Carro ? "C" : "O",
				veiculo.getCliente() != null ? veiculo.getCliente().getCod_cliente() : null,
				veiculo.getCliente() != null ? veiculo.getCliente().getNome() : "Sem dono");
	}
}
