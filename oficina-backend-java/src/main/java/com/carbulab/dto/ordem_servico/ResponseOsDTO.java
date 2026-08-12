package com.carbulab.dto.ordem_servico;

import com.carbulab.domain.ordem_servico.OrdemServico;
import com.carbulab.domain.veiculo.Modelo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ResponseOsDTO(
		@JsonProperty("cod_os") Integer codOs,
		@JsonProperty("data_os") LocalDate dataOs,
		Integer quilometragem,
		String descricao,
		@JsonProperty("tipo_desconto") String tipoDesconto,
		BigDecimal desconto,
		@JsonProperty("valor_total") BigDecimal valorTotal,
		@JsonProperty("valor_pago") BigDecimal valorPago,
		Integer fk_cod_veiculo,
		Long fk_cod_cliente,
		String nome_cliente,
		Modelo modelo,
		String placa,
		Integer ano,
		String cor,
		@JsonProperty("status_servico") Integer statusServico,
		List<ItemResponseDTO> pecas,
		List<ItemResponseDTO> servicos) {

	public record ItemResponseDTO(
			@JsonProperty("cod_associativa") Integer codAssociativa,
			@JsonProperty("cod_item") Integer codItem,
			String nome,
			Integer quantidade,
			@JsonProperty("valor_unitario") BigDecimal valorUnitario,
			BigDecimal subtotal) {
	}

	public ResponseOsDTO(OrdemServico os, BigDecimal valorTotal) {
		this(
				os.getCodOs(),
				os.getDataOs(),
				os.getQuilometragem(),
				os.getDescricao(),
				os.getTipoDesconto(),
				os.getDesconto(),
				valorTotal,
				os.getValorPago(),
				os.getVeiculo() != null ? os.getVeiculo().getCod_veiculo() : null,
				os.getVeiculo() != null && os.getVeiculo().getCliente() != null ? os.getVeiculo().getCliente().getCod_cliente() : null,
				os.getVeiculo() != null && os.getVeiculo().getCliente() != null ? os.getVeiculo().getCliente().getNome() : "Sem dono",
				os.getVeiculo() != null && os.getVeiculo().getModelo() != null ? os.getVeiculo().getModelo() : null,
				os.getVeiculo() != null ? os.getVeiculo().getPlaca() : null,
				os.getVeiculo() != null ? os.getVeiculo().getAno() : null,
				os.getVeiculo() != null ? os.getVeiculo().getCor() : null,
				os.getStatusServico(),
				os.getPecas().stream().map(p -> new ItemResponseDTO(
						p.getCod_os_peca(), p.getPeca().getCod_peca(), p.getPeca().getNomePeca(),
						p.getQuantidade(), p.getValorUnitario(),
						p.getValorUnitario().multiply(new BigDecimal(p.getQuantidade())))).collect(Collectors.toList()),
				os.getServicos().stream().map(s -> new ItemResponseDTO(
						s.getCod_os_servico(), s.getServico().getCod_servico(), s.getServico().getNomeServico(),
						s.getQuantidade(), s.getValorUnitario(),
						s.getValorUnitario().multiply(new BigDecimal(s.getQuantidade()))))
						.collect(Collectors.toList()));
	}
}