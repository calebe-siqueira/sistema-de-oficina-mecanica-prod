package com.carbulab.domain;

import java.text.ParseException;
import javax.swing.text.MaskFormatter;

public class Endereco {
    
    private String cep;
    private String uf;
    private String cidade;
    private String bairro;
    private String logradouro;
    private int numero;
    private String complemento;

    public Endereco(String cep, String uf, String cidade, String bairro, String logradouro, int numero, String complemento) {
        this.setCep(cep);
        this.setUf(uf);
        this.setCidade(cidade);
        this.setBairro(bairro);
        this.setLogradouro(logradouro);
        this.setNumero(numero);
        this.setComplemento(complemento);
    }

    public Endereco() {}

    public String getCep() {
        return cep;
    }

    public String getCepFormatado() {
        
        if (cep != null) {
            if (!cep.trim().equals("")) {
                //String cep = this.cep.replaceAll("[^[0-9]]", "");

                MaskFormatter mascara = null;
                try {
                    mascara = new MaskFormatter("AA.AAA-AAA");

                    mascara.setValueContainsLiteralCharacters(false);
                    return mascara.valueToString(cep);

                } catch (ParseException ex) {}    
            }        
        }
        return "";
    }

    public void setCep(String cep) {
        if ((cep != null?!cep.isEmpty():true)) { // Cep não pode mais ser obrigatório devido às inserções que vieram do backup da oficina
            // throw new IllegalArgumentException("CEP inválido");
        } else if (!cep.matches("([0-9]{2})[.-]?([0-9]{3})[-.]?([0-9]{3})")) {
            throw new IllegalArgumentException("CEP inválido");
        }
        this.cep = cep;
    }

    public String getUf() {
        return uf;
    }

    public void setUf(String uf) {
        if (uf != null) { // Pode ser null depois que inseriu backup
            if (!uf.matches("[A-z]{2}")) {
                throw new IllegalArgumentException("UF inválido");
            }
        }
        this.uf = uf;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public int getNumero() {
        return numero;
    }

    public void setNumero(int num) {
        if (num < 0) {
            throw new IllegalArgumentException("Número inválido para endereço");
        }
        this.numero = num;
    }

    public String getComplemento() {
        return complemento;
    }

    public void setComplemento(String complemento) {
        if (complemento == null) {
            complemento = "";
        }
        this.complemento = complemento;
    }
    
}