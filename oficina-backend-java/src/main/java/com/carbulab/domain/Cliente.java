package com.carbulab.domain;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import javax.swing.text.MaskFormatter;

public class Cliente extends Pessoa {
    
    public static ArrayList<Cliente> clientes = new ArrayList<>();
        
    private int cod_cliente;
    private String celular;
    private String telefone;
    private Endereco endereco;
    private String rg;
    private String cpf_cnpj;
    private Date nascimento;
    private char tipo;
    
    private ArrayList<Carro> carros = new ArrayList<>();

    // Construtor com codigo do cliente:
    public Cliente(int cod_cliente, String nome, String email, String celular, String telefone, Endereco endereco, String rg, String cpf, Date nascimento, char tipo) {
        // Superclasse:
        super(nome, email);
        
        // Subclasse
        this.cod_cliente = cod_cliente;
        this.setCelular(celular);
        this.setTelefone(telefone);
        this.setEndereco(endereco);
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
    public Cliente(String nome, String email, String celular, String telefone, Endereco endereco, String rg, String cpf, Date nascimento, Character tipo) {
        // Superclasse:
        super(nome, email);
        
        // Subclasse
        this.setCelular(celular);
        this.setTelefone(telefone);
        this.setEndereco(endereco);
        this.setTipo(tipo);
        if (tipo == 'F') {
            this.setCpf(cpf);
            this.setRg(rg);
            this.setNascimento(nascimento);
        } else if (tipo == 'J') {
            this.setCnpj(cpf);
        }
        
    }
    
    public int getCodigo() {
        return cod_cliente;
    }

    public String getCelular() {
        return celular;
    }
    
    public String getCelularFormatado() {
        return formatarCelular_Telefone(this.celular);
    }
    
    public void setCelular(String celular) {
        if (celular != null) {
            if (!celular.equals("")) {
                if (!celular.matches("(([+]?[0-9]{3})?([(]?[0-9]{2,3}[)]?)?[ ]?[9]?[ ]?([0-9]{4})[ -]?([0-9]{4}))")) {
                    throw new IllegalArgumentException("Celular inválido para " + this.getNome());
                }
            }
        }
        this.celular = celular;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getTelefoneFormatado() {
        return formatarCelular_Telefone(this.telefone);
    }

    public void setTelefone(String telefone) {
        if (telefone != null) {
            if (!telefone.equals("")) {
                if (!telefone.matches("(([+]?[0-9]{3})?([(]?[0-9]{2,3}[)]?)?[ ]?[9]?[ ]?([0-9]{4})[ -]?([0-9]{4}))")) {
                    throw new IllegalArgumentException("Telefone inválido para " + this.getNome());
                }
            }
        }
        this.telefone = telefone;
    }

    public Endereco getEndereco() {
        return endereco;
    }

    public void setEndereco(Endereco endereco) {
        this.endereco = endereco;
    }

    public ArrayList<Carro> getCarros() {
        return carros;
    }

    public void setCarros(ArrayList<Carro> carros) {
        this.carros = carros;
    }

    public void adicionarCarro(Carro carro) {
        this.carros.add(carro);
    }
    
    public String getRg() {
        return rg;
    }

    public void setRg(String rg) {
        /*if (rg != null) {
            if (!rg.equals("")) {
                if (!rg.matches("[A-z]?([0-9]{2})[.]?([0-9]{3})[-.]?([0-9]{3})")) { // [A-z]?([0-9]{1,2})[.]?([0-9]{3})[.]?([0-9]{3})[-]?([0-9]{1}|X|x)
                    throw new IllegalArgumentException("RG inválido para " + this.getNome());
                }
            }
        }*/ // RGs não tem número fixo de dígitos, sendo que, em alguns estados, eles possuem mais e em outros menos (MUITO COMPLICADO VALIDAR RG!!!);
        this.rg = rg;
    }

    public String getCpf_Cnpj() {
        return cpf_cnpj;
    }
    
    public String getCpf_CnpjFormatado() {
        return formatarCpf_Cnpj(this.cpf_cnpj);
    }

    public void setCpf(String cpf) {
        if (!validadorCpf(cpf)) {
            throw new IllegalArgumentException("CPF inválido para " + this.getNome());
        }
        this.cpf_cnpj = cpf;
    }
    public void setCnpj(String cnpj) {
        if (!validadorCnpj(cnpj)) {
            throw new IllegalArgumentException("CNPJ inválido para " + this.getNome());
        }
        this.cpf_cnpj = cnpj;
    }

    public Date getNascimento() {
        return nascimento;
    }

    public String getNascimentoFormatado() {
        if (nascimento != null) {
            SimpleDateFormat formatoData = new SimpleDateFormat("dd/MM/yyyy");

            return formatoData.format(this.nascimento).trim();
        }
        return "";
    }

    public void setNascimento(Date nascimento) {
        
        // Pegando ano atual do sistema:
        Calendar calendario = Calendar.getInstance();
        int anoAtual = calendario.get(Calendar.YEAR);
        
        if (nascimento != null) {
            if ((anoAtual-nascimento.getYear()) < 1) {
                throw new IllegalArgumentException("Data de nascimento inválida para " + this.getNome());
            }
        }
        this.nascimento = nascimento;
    }

    public char getTipo() {
        return tipo;
    }

    public void setTipo(char tipo) {
        this.tipo = tipo;
    }
    
    public static boolean validadorCpf(String cpf) {
        
        if (cpf != null) {
            if (cpf.matches("([0-9]{3})[.]?([0-9]{3})[.]?([0-9]{3})[-]?([0-9]{2})")) {
                cpf = cpf.replaceAll("([.-])", "");
                if (cpf.matches("([0]{11})|([1]{11})|([2]{11})|([3]{11})|([4]{11})|([5]{11})|([6]{11})|([7]{11})|([8]{11})|([9]{11})") ||
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
    
    public static boolean validadorCnpj(String cnpj) {
        
        if (cnpj != null) {
            if (cnpj.matches("([0-9]{2})[ .]?([0-9]{3})[ .]?([0-9]{3})[ /]?([0-9]{4})[ -]?([0-9]{2})")) {
                cnpj = cnpj.replaceAll("([.//-])", "");
                if (cnpj.matches("([0]{14})|([1]{14})|([2]{14})|([3]{14})|([4]{14})|([5]{14})|([6]{14})|([7]{14})|([8]{14})|([9]{14})") ||
                    cnpj.length() != 14) {
                    return false;
                } else {
                    // Cálculo do dígito validador 1:
                    int[] aux = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
                    int digito1 = 0, digito2 = 0, digito;

                    for (int i = 0; i < 12; i++) {
                        digito1 += Integer.parseInt(cnpj.substring(i, i+1)) * aux[i+1];
                    }
                    digito1 %= 11;
                    if (digito1 < 2) {
                        digito1 = 0;
                    } else {
                        digito1 = 11 - digito1;
                    }

                    // Cálculo do dígito validador 2:
                    for (int i = 0; i < 13; i++) {
                        digito2 += Integer.parseInt(cnpj.substring(i, i+1)) * aux[i];
                    }
                    digito2 %= 11;
                    if (digito2 < 2) {
                        digito2 = 0;
                    } else {
                        digito2 = 11 - digito2;
                    }
                    // Checagem do dígito validador digitado:
                    digito = (digito1 * 10) + digito2;

                    return (Integer.parseInt(cnpj.substring(12, 14)) == digito);
                } 
            } else {
                return false;
            }
        }
        return true;
    }
    
    private String formatarCelular_Telefone(String celular_telefone) {
        
        if (celular_telefone != null) {
            if (!celular_telefone.trim().equals("") && (celular_telefone.trim().length() >= 8 && celular_telefone.trim().length() <= 11)) {
                
                //celular_telefone = celular_telefone.replaceAll("[^[0-9]]", "");

                if (celular_telefone.charAt(0) == '0') { // Caso o número comece com 0, por exemplo 031..., ele remove o zero para prosseguir;
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
                    mascara.setValueContainsLiteralCharacters(false);
                    return mascara.valueToString(celular_telefone).trim();

                } catch (ParseException ex) {}
            }
        }
        return "";
    }
    
    private String formatarCpf_Cnpj(String cpf_cnpj) {
        
        if (cpf_cnpj != null) {
            
            //cpf_cnpj = cpf_cnpj.replaceAll("[^[0-9]]", "");

            MaskFormatter mascara = null;
            try {
                if (cpf_cnpj.length() == 14) {
                    mascara = new MaskFormatter("AA.AAA.AAA/AAAA-AA"); // Máscara para cnpj;
                } else if (cpf_cnpj.length() == 11) {
                    mascara = new MaskFormatter("AAA.AAA.AAA-AA"); // Máscara para cpf;
                }
                
                mascara.setValueContainsLiteralCharacters(false);
                return mascara.valueToString(cpf_cnpj).trim();

            } catch (ParseException ex) {}            
        }
        return "";
    }
    
    // Métodos:
    public void visualizarHistorico() {
        for (Carro carro : carros) {
            carro.exibirDados();
            carro.visualizarHistorico();
            System.out.println("");
        }
    }
    
}