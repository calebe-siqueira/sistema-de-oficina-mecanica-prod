package com.carbulab.utils;

public class ConsultaPorPlaca {
    
    /**
     * Somente recebe a placa no formato antigo e retorna a placa correspondente no formato Mercosul;
     * (caso a placa recebida já esteja no formato Mercosul, é feito o caminho reverso, retornando-a no formato antigo)
     * 
     * - Não é preciso passar a placa completa, podendo ser feita a busca mesmo com os dígitos finais faltando (ex: "HIK95" retornaria "HIK9F" para Mercosul, e "HIK9F" retornaria "HIK95" para formato antigo);
     * 
     */
    public static String adaptaPlacaParaFormatoMercosul(String placa) {
        
        placa = placa.replaceAll("([ -])", "").toUpperCase(); // Remove espaços e hífens, e converte para maiúscula para padronizar a entrada;
        char digitoASerTrocado = 0; // Armazena o dígito que deve ser trocado (5º dígito), seja ele letra ou número, dependendo do formato da placa recebida;
        
        if (placa.length() <= 7 && placa.length() >= 5) {
            digitoASerTrocado = placa.charAt(4); // Pega o 5º dígito da placa, que deve ser trocado;

            String placaTratada;
            boolean mercosul = false; // Variável para armazenar se a placa já está em Mercosul (true) ou não (false) -- false por padrão;
            int valor = 0; // Só usa se for tranformar para Mercosul;
            try {
                valor = Integer.parseInt(String.format("%s", digitoASerTrocado)); // Transforma o valor do dígito pego de char para int, causando um erro caso a placa já esteja no formato Mercosul, pois haverá entrada de letra;
            } catch (Exception e) {
                mercosul = true; // Se erro, a placa já está no formato Mercosul, devendo ser feita a conversão para o formato antigo;
            }

            // if (placa.length() == 7 && (placa.matches("[A-z]{3}[0-9]{4}") || placa.matches("[A-z]{3}[0-9]{1}[A-z]{1}[0-9]{2}"))) {

            if (!mercosul) { // Se transformar em Mercosul:
                placaTratada = converteParaMercosul(placa, valor);
            } else { // Se transformar em formato antigo:
                placaTratada = converteParaAntigo(placa, digitoASerTrocado);
            }
            return placaTratada;
        } else {
            return null;
        }
    }

    private static String converteParaMercosul(String placa, int numeroPlacaAntiga) {
        char novoDigito = 0;
        switch (numeroPlacaAntiga) {
            case 0 -> novoDigito = 'A';
            case 1 -> novoDigito = 'B';
            case 2 -> novoDigito = 'C';
            case 3 -> novoDigito = 'D';
            case 4 -> novoDigito = 'E';
            case 5 -> novoDigito = 'F';
            case 6 -> novoDigito = 'G';
            case 7 -> novoDigito = 'H';
            case 8 -> novoDigito = 'I';
            case 9 -> novoDigito = 'J';
            default -> throw new AssertionError("Placa inválida");
        }
        String retorno = placa.substring(0, 4) + novoDigito;
        if (placa.length() > 5) { // Pega os dígitos finais da placa apenas se existirem (não sendo obrigatório inserção da placa completa);
            retorno += placa.substring(5);
        }
        return retorno;
    }

    private static String converteParaAntigo(String placa, char digitoASerTrocado) {
        int novoDigito = 0;
        switch (digitoASerTrocado) {
            case 'A' -> novoDigito = 0;
            case 'B' -> novoDigito = 1;
            case 'C' -> novoDigito = 2;
            case 'D' -> novoDigito = 3;
            case 'E' -> novoDigito = 4;
            case 'F' -> novoDigito = 5;
            case 'G' -> novoDigito = 6;
            case 'H' -> novoDigito = 7;
            case 'I' -> novoDigito = 8;
            case 'J' -> novoDigito = 9;
            default -> throw new AssertionError("Placa inválida");
        }
        String retorno = placa.substring(0, 4) + novoDigito;
        if (placa.length() > 5) { // Pega os dígitos finais da placa apenas se existirem (não sendo obrigatório inserção da placa completa);
            retorno += placa.substring(5);
        }
        return retorno;
    }
    
    /**
     * Realiza a busca por placa, utilizando a API pública de consulta de placas do Brasil (https://placa-fipe.apibrasil.com.br/), que retorna os dados do veículo associado à placa consultada.
     * 
     * ! Ainda não implementado por ser opção paga !
     */
    public static void buscarPlaca(String placa) {
        /*
        if (TestaConexao.testeDeConexao()) {
            try {
                URL url = new URL("https://placa-fipe.apibrasil.com.br/placa/consulta" + cep + "&formato=xml");

                SAXReader xml = new SAXReader();
                Document documento = xml.read(url);
                Element root = documento.getRootElement();

                String tipoLogradouro = null;

                for (Iterator<Element> it = root.elementIterator(); it.hasNext();) {
                    Element element = it.next();
                    if (element.getQualifiedName().equals("cidade")) {
                        txtCidade.setText(element.getText());
                    } else if (element.getQualifiedName().equals("uf")) {
                        cbUf.setSelectedItem(element.getText());
                    } else if (element.getQualifiedName().equals("bairro")) {
                        txtBairro.setText(element.getText());
                    } else if (element.getQualifiedName().equals("tipo_logradouro")) {
                        tipoLogradouro = element.getText();
                    } else if (element.getQualifiedName().equals("logradouro")) {
                        txtEndereco.setText(tipoLogradouro + element.getText());
                    }
                }

            } catch (Exception e) {
                JOptionPane.showMessageDialog(this, "Erro na busca por CEP", "CEP", JOptionPane.ERROR_MESSAGE);                
            }

        }*/
    }
    
}
