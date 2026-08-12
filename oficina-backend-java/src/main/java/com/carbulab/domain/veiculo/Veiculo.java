package com.carbulab.domain.veiculo;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import javax.swing.text.MaskFormatter;

import com.carbulab.domain.ordem_servico.OrdemServico;
import com.carbulab.domain.cliente.Cliente;
import com.carbulab.exception.BusinessValidationException;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Transient;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity(name = "Veiculo")
@Table(name = "tb_veiculo")
@SQLDelete(sql = "UPDATE tb_veiculo SET deleted_at = CURRENT_TIMESTAMP WHERE cod_veiculo = ?")
@SQLRestriction("deleted_at IS NULL")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo", discriminatorType = DiscriminatorType.STRING)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public abstract class Veiculo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int cod_veiculo;
	@jakarta.persistence.ManyToOne
	@jakarta.persistence.JoinColumn(name = "fk_cod_modelo")
	private Modelo modelo;
	private int ano;
	private String placa;
	private String cor;
	private String combustivel;
	@Transient
	private String ultimaOrdemDeServico; // Variável exclusiva da classe, sendo preenchida em tempo de execução e não sendo armazenada no banco de dados;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@ManyToOne
	@JoinColumn(name = "fk_cod_cliente")
	@NotFound(action = NotFoundAction.IGNORE)
	private Cliente cliente;

	@OneToMany(mappedBy = "veiculo", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<OrdemServico> ordensDeServico = new ArrayList<>();

	// Construtor com codigo do veiculo:
	public Veiculo(int cod_veiculo, Modelo modelo, int ano, String placa, String cor,
			String combustivel) {
		this.cod_veiculo = cod_veiculo;
		this.setModelo(modelo);
		this.setAno(ano);
		this.setPlaca(placa);
		this.setCor(cor);
		this.setCombustivel(combustivel);
		atualizarUltimaOrdemDeServico();
	}

	// Construtor sem codigo do veículo:
	public Veiculo(Modelo modelo, int ano, String placa, String cor, String combustivel) {
		this.setModelo(modelo);
		this.setAno(ano);
		this.setPlaca(placa);
		this.setCor(cor);
		this.setCombustivel(combustivel);
		atualizarUltimaOrdemDeServico();
	}

	public int getCod_veiculo() {
		return cod_veiculo;
	}

	public int getAno() {
		return ano;
	}

	public void setAno(int ano) {

		// Pegando ano atual do sistema:
		Calendar calendario = Calendar.getInstance();
		int anoAtual = calendario.get(Calendar.YEAR);

		if (ano < 0 || ano > anoAtual + 1) {
			throw new BusinessValidationException("Ano de fabricação inválido");
		}
		this.ano = ano;
	}

	public String getPlaca() {
		return placa;
	}

	public String getPlacaFormatada() {
		if (placa != null) {
			String placa = this.placa.replaceAll("[-]", "");

			if (placa.matches("[A-z]{3}[ -]?[0-9]{4}")) { // Se placa padrão antigo:
				try {
					MaskFormatter mascara = new MaskFormatter("AAA-AAAA");

					mascara.setValueContainsLiteralCharacters(false);
					return mascara.valueToString(placa).toUpperCase();

				} catch (ParseException ex) {
				}
			} else if (placa.matches("[A-z]{3}[0-9]{1}[A-z]{1}[0-9]{2}")) { // Se placa Mercosul:
				return placa.toUpperCase();
			} else {
				throw new BusinessValidationException("Placa passada inválida para formatação. A placa informada não é nem do padrão antigo nem do padrão Mercosul.");
			}
		}
		return null;
	}

	public void setPlaca(String placa) {
		// Validação de placa: placa padrão antigo || placa padrão Mercosul;
		if (placa != null) {
			if (!placa.matches("[A-z]{3}[ -]?[0-9]{4}") && !placa.matches("[A-z]{3}[0-9]{1}[A-z]{1}[0-9]{2}")) {
				throw new BusinessValidationException("Formato inválido para a placa do veículo");
			}
			this.placa = placa;
		} else {
			throw new BusinessValidationException("Placa não pode ser nula");
		}
	}

	public String getCor() {
		return cor;
	}

	public void setCor(String cor) {
		this.cor = cor;
	}

	public String getCombustivel() {
		return combustivel;
	}

	public void setCombustivel(String combustivel) {
		this.combustivel = combustivel;
	}

	public String getUltimaOrdemDeServico() {
		return ultimaOrdemDeServico;
	}

	public void atualizarUltimaOrdemDeServico() {
		int indiceUltimaOrdem = ordensDeServico.size() - 1;
		this.ultimaOrdemDeServico = indiceUltimaOrdem >= 0
				? this.getOrdensDeServico().get(indiceUltimaOrdem).getDataFormatada()
				: "Nunca";
	}

	// Métodos:
	public void setOrdensDeServico(List<OrdemServico> ordensDeServico) {
		this.ordensDeServico = ordensDeServico;
		atualizarUltimaOrdemDeServico();
	}

	public List<OrdemServico> getOrdensDeServico() {
		return ordensDeServico;
	}

	public void adicionarOrdemDeServico(OrdemServico ordemDeServico) {
		this.ordensDeServico.add(ordemDeServico);
		atualizarUltimaOrdemDeServico();
	}

}
