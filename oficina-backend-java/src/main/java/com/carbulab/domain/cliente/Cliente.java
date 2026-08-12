package com.carbulab.domain.cliente;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Calendar;
import javax.swing.text.MaskFormatter;

import com.carbulab.domain.Pessoa;
import com.carbulab.domain.veiculo.Veiculo;
import com.carbulab.exception.BusinessValidationException;

import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Classe entidade CLIENTE:
 * 
 * - Modelo do banco de dados
 * 
 * Representa diretamente a tabela de clientes no banco de dados,
 * contendo todos os campos dela (até os sensíveis, como senhas),
 * sendo que, por isso, o ideal é nunca expor essa classe diretamente
 * para o mundo externo para evitar problemas de segurança.
 */
@Table(name = "tb_cliente")
@Entity(name = "Cliente")
@SQLDelete(sql = "UPDATE tb_cliente SET deleted_at = CURRENT_TIMESTAMP WHERE cod_cliente = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@EqualsAndHashCode(of = "cod_cliente", callSuper = false) // Gera equals e hashCode apenas com base no cod_cliente, ignorando os campos da superclasse Pessoa;
@AttributeOverride(name = "nome", column = @Column(name = "nome_cliente")) // Sobrescreve o campo nome da superclasse Pessoa, renomeando para "nome_cliente";
public class Cliente extends Pessoa {

    public static ArrayList<Cliente> clientes = new ArrayList<>();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cod_cliente")
    private long cod_cliente;
    private String celular;
    private String telefone;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "fk_cod_endereco", referencedColumnName = "cod_endereco")
    private Endereco endereco; // Relacionamento com tabela Endereco
    private String rg;
    @Column(name = "cpf_cnpj")
    private String cpf_cnpj;
    @Column(name = "data_nascimento")
    private LocalDate data_nascimento;
    private Character tipo;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Veiculo> veiculos = new ArrayList<>();

    // Construtor padrão (necessário para JPA)
    public Cliente() {
        super("", "");
    }

    // Construtor com codigo do cliente:
    public Cliente(long cod_cliente, String nome, String email, String celular, String telefone, Endereco endereco,
            String rg, String cpf, LocalDate nascimento, Character tipo) {
        // Superclasse:
        super(nome, email);

        // Subclasse
        this.cod_cliente = cod_cliente;
        this.setCelular(celular);
        this.setTelefone(telefone);
        this.endereco = endereco;
        this.setTipo(tipo);
        if (tipo == 'F') {
            this.setCpf(cpf);
            this.setRg(rg);
            this.setNascimento(nascimento);
        } else if (tipo == 'J') {
            this.setCnpj(cpf);
        }
    }

    // Construtor sem codigo do cliente:
    public Cliente(String nome, String email, String celular, String telefone, Endereco endereco, String rg, String cpf,
            LocalDate nascimento, Character tipo) {
        // Superclasse:
        super(nome, email);

        // Subclasse
        this.setCelular(celular);
        this.setTelefone(telefone);
        this.endereco = endereco;
        this.setTipo(tipo);
        if (tipo == 'F') {
            this.setCpf(cpf);
            this.setRg(rg);
            this.setNascimento(nascimento);
        } else if (tipo == 'J') {
            this.setCnpj(cpf);
        }

    }

    public String getCelularFormatado() {
        return formatarCelular_Telefone(this.celular);
    }

    public void setCelular(String celular) {
        if (!isValidCelularTelefone(celular)) {
            throw new BusinessValidationException("Celular inválido");
        }
        this.celular = celular;
    }

    public String getTelefoneFormatado() {
        return formatarCelular_Telefone(this.telefone);
    }

    public void setTelefone(String telefone) {
        if (!isValidCelularTelefone(telefone)) {
            throw new BusinessValidationException("Telefone inválido");
        }
        this.telefone = telefone;
    }

    // PROVISÓRIO:
    public Long getFk_cod_endereco() {
        return this.endereco != null ? this.endereco.getCod_endereco() : null;
    }

    public void adicionarVeiculo(Veiculo veiculo) {
        this.veiculos.add(veiculo);
        veiculo.setCliente(this);
    }

    public String getCpf_CnpjFormatado() {
        return formatarCpf_Cnpj(this.cpf_cnpj);
    }

    public void setCpf(String cpf) {
        if (!validadorCpf(cpf)) {
            throw new BusinessValidationException("CPF inválido");
        }
        this.cpf_cnpj = cpf;
    }

    public void setCnpj(String cnpj) {
        if (!ValidadorCNPJ.isValid(cnpj)) {
            throw new BusinessValidationException("CNPJ inválido");
        }
        this.cpf_cnpj = cnpj;
    }

    public String getNascimentoFormatado() {
        if (data_nascimento != null) {
            SimpleDateFormat formatoData = new SimpleDateFormat("dd/MM/yyyy");

            return formatoData.format(this.data_nascimento).trim();
        }
        return "";
    }

    public void setNascimento(LocalDate nascimento) {
        // Pegando ano atual do sistema:
        Calendar calendario = Calendar.getInstance();
        int anoAtual = calendario.get(Calendar.YEAR);

        if (nascimento != null) {
            if ((anoAtual - nascimento.getYear()) < 1) {
                throw new BusinessValidationException(
                        "Data de nascimento inválida (data de nascimento deve ser anterior ao ano atual)");
            }
        }
        this.data_nascimento = nascimento;
    }

	private boolean isValidCelularTelefone(String celularTelefone) {
		if (celularTelefone != null) {
            if (!celularTelefone.equals("")) {
                if (!celularTelefone.matches("(([+]?[0-9]{3})?([(]?[0-9]{2,3}[)]?)?[ ]?[0-9]?[ ]?([0-9]{4})[ -]?([0-9]{4}))")) {
                    return false;
                }
            }
        }
		return true;
	}

    // MÉTODOS FORMATAÇÃO CPF, CNPJ, CELULAR E TELEFONE:

    private String formatarCelular_Telefone(String celular_telefone) {

        if (celular_telefone != null) {
            if (!celular_telefone.trim().equals("")
                    && (celular_telefone.trim().length() >= 8 && celular_telefone.trim().length() <= 11)) {

                // celular_telefone = celular_telefone.replaceAll("[^[0-9]]", "");

                if (celular_telefone.charAt(0) == '0') { // Caso o número comece com 0, por exemplo 031..., ele remove o
                                                         // zero para prosseguir;
                    if (celular_telefone.charAt(1) == '0') {
                        celular_telefone = celular_telefone.substring(2);
                    } else {
                        celular_telefone = celular_telefone.substring(1);
                    }
                }

                MaskFormatter mascara = null;
                try {
                    switch (celular_telefone.length()) {
                        case 8:
                            mascara = new MaskFormatter("AAAA-AAAA");
                            break;
                        case 9:
                            mascara = new MaskFormatter("AAAAA-AAAA");
                            break;
                        case 10:
                            mascara = new MaskFormatter("(AA) AAAA-AAAA");
                            break;
                        case 11:
                            mascara = new MaskFormatter("(AA) AAAAA-AAAA");
                            break;
                    }
                    if (mascara != null) {
                        mascara.setValueContainsLiteralCharacters(false);
                        return mascara.valueToString(celular_telefone).trim();
                    }

                } catch (ParseException ex) {
                }
            }
        }
        return "";
    }

    private String formatarCpf_Cnpj(String cpf_cnpj) {

        if (cpf_cnpj != null) {

            // cpf_cnpj = cpf_cnpj.replaceAll("[^[0-9]]", "");

            MaskFormatter mascara = null;
            try {
                if (cpf_cnpj.length() == 14) {
                    mascara = new MaskFormatter("AA.AAA.AAA/AAAA-AA"); // Máscara para cnpj;
                } else if (cpf_cnpj.length() == 11) {
                    mascara = new MaskFormatter("AAA.AAA.AAA-AA"); // Máscara para cpf;
                }

                if (mascara != null) {
                    mascara.setValueContainsLiteralCharacters(false);
                    return mascara.valueToString(cpf_cnpj).trim();
                }

            } catch (ParseException ex) {
            }
        }
        return "";
    }

    // MÉTODOS VALIDAÇÃO CPF E CNPJ:

    public static boolean validadorCpf(String cpf) {

        if (cpf != null) {
            if (cpf.matches("([0-9]{3})[.]?([0-9]{3})[.]?([0-9]{3})[-]?([0-9]{2})")) {
                cpf = cpf.replaceAll("([.-])", "");
                if (cpf.matches(
                        "([0]{11})|([1]{11})|([2]{11})|([3]{11})|([4]{11})|([5]{11})|([6]{11})|([7]{11})|([8]{11})|([9]{11})")
                        ||
                        cpf.length() != 11) {
                    return false;
                } else {
                    // Cálculo do dígito validador 1:
                    int aux = 10;
                    int digito1 = 0, digito2 = 0, digito;

                    for (int i = 0; i < 9; i++) {
                        digito1 += Integer.parseInt(cpf.substring(i, i + 1)) * aux--;
                    }
                    digito1 %= 11;
                    if (digito1 < 2) {
                        digito1 = 0;
                    } else {
                        digito1 = 11 - digito1;
                    }

                    // Cálculo do dígito validador 2:
                    aux = 10;
                    for (int i = 1; i < 10; i++) {
                        digito2 += Integer.parseInt(cpf.substring(i, i + 1)) * aux--;
                    }
                    digito2 %= 11;
                    if (digito2 < 2) {
                        digito2 = 0;
                    } else {
                        digito2 = 11 - digito2;
                    }
                    // Checagem do dígito validador digitado:
                    digito = (digito1 * 10) + digito2;

                    return (Integer.parseInt(cpf.substring(9, 11)) == digito);
                }
            } else {
                return false;
            }
        }
        return true;
    }

    /**
     * Classe interna responsável por validar CNPJ.
     * 
     * - Código retirado do site da receita federal para validação do novo formato
     * de CNPJ alfanumérico;
     * - O formato do CNPJ mudou de apenas números para aceitar letras e números;
     */
    private class ValidadorCNPJ {

        private static final int TAMANHO_CNPJ_SEM_DV = 12;
        private static final String REGEX_CARACTERES_FORMATACAO = "[./-]";
        private static final String REGEX_FORMACAO_BASE_CNPJ = "[A-Z\\d]{12}";
        private static final String REGEX_FORMACAO_DV = "[\\d]{2}";
        private static final String REGEX_VALOR_ZERADO = "^[0]+$";
        private static final int VALOR_BASE = (int) '0';
        private static final int[] PESOS_DV = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        /**
         * Verifica se o CNPJ é válido.
         * 
         * @param cnpj O CNPJ a ser validado (numérico ou alfanumérico).
         * @return true se o CNPJ for válido, false caso contrário.
         */
        protected static boolean isValid(String cnpj) {
            if (cnpj != null) {
                cnpj = removeCaracteresFormatacao(cnpj);
                if (isCnpjFormacaoValidaComDV(cnpj)) {
                    String dvInformado = cnpj.substring(TAMANHO_CNPJ_SEM_DV);
                    String dvCalculado = calculaDV(cnpj.substring(0, TAMANHO_CNPJ_SEM_DV));
                    return dvCalculado.equals(dvInformado);
                }
            }
            return false;
        }

        /**
         * Calcula o dígito verificador do CNPJ (dois dígitos).
         * 
         * @param baseCnpj O CNPJ base a ser validado (numérico ou alfanumérico).
         * @return O dígito verificador do CNPJ.
         */
        protected static String calculaDV(String baseCnpj) {
            if (baseCnpj != null) {
                baseCnpj = removeCaracteresFormatacao(baseCnpj);
                if (isCnpjFormacaoValidaSemDV(baseCnpj)) {
                    String dv1 = String.format("%d", calculaDigito(baseCnpj));
                    String dv2 = String.format("%d", calculaDigito(baseCnpj.concat(dv1)));
                    return dv1.concat(dv2);
                }
            }
            throw new BusinessValidationException(String.format("Cnpj %s não é válido para o cálculo do DV", baseCnpj));
        }

        /**
         * Calcula cada dígito verificador do CNPJ.
         * 
         * @param cnpj O CNPJ a ser validado (numérico ou alfanumérico).
         * @return O dígito verificador do CNPJ.
         */
        private static int calculaDigito(String cnpj) {
            int soma = 0;
            for (int indice = cnpj.length() - 1; indice >= 0; indice--) {
                int valorCaracter = (int) cnpj.charAt(indice) - VALOR_BASE;
                soma += valorCaracter * PESOS_DV[PESOS_DV.length - cnpj.length() + indice];
            }
            return soma % 11 < 2 ? 0 : 11 - (soma % 11);
        }

        /**
         * Remove os caracteres de formatação do CNPJ.
         * 
         * @param cnpj O CNPJ a ser validado (numérico ou alfanumérico).
         * @return O CNPJ sem os caracteres de formatação.
         */
        private static String removeCaracteresFormatacao(String cnpj) {
            return cnpj.trim().replaceAll(REGEX_CARACTERES_FORMATACAO, "");
        }

        /**
         * Verifica se o CNPJ possui a formação base válida.
         * 
         * @param cnpj O CNPJ a ser validado (numérico ou alfanumérico), sem o dígito verificador.
         * @return true se o CNPJ possui a formação base válida, false caso contrário.
         */
        private static boolean isCnpjFormacaoValidaSemDV(String cnpj) {
            return cnpj.matches(REGEX_FORMACAO_BASE_CNPJ) &&
                    !cnpj.matches(REGEX_VALOR_ZERADO);
        }

        /**
         * Verifica se o CNPJ possui a formação com dígito verificador válida.
         * 
         * @param cnpj O CNPJ a ser validado (numérico ou alfanumérico), com o dígito verificador.
         * @return true se o CNPJ possui a formação com dígito verificador válida, false caso contrário.
         */
        private static boolean isCnpjFormacaoValidaComDV(String cnpj) {
            return cnpj.matches(REGEX_FORMACAO_BASE_CNPJ.concat(REGEX_FORMACAO_DV)) &&
                    !cnpj.matches(REGEX_VALOR_ZERADO);
        }

    }
}
