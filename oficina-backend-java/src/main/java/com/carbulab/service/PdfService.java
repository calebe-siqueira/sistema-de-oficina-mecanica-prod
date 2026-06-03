package com.carbulab.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;

@Service
public class PdfService {

    protected static final Font helveticaNegrito12 = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
    protected static final Font helveticaNegrito10 = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
    protected static final Font helveticaNormal12 = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL);
    protected static final Font helveticaNormal10 = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);

    protected static final String nomeEmpresa = "Mecânica Carbulab";
    protected static final String cnpjEmpresa = "86.491.834/0001-62";

    // Métodos:
    protected static PdfPCell criarCelulaCabecalho(String label, String valor, Font fonte) {
        return new PdfPCell(new Phrase(label + ": " + (valor != null ? valor : "N/A"), fonte)) {
            {
                setBorder(Rectangle.NO_BORDER);
            }
        };
    }

    protected static String dataFormatada(Object data) {
        try {
            LocalDateTime dataFormatada = LocalDateTime.parse(data.toString());
            return dataFormatada.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e) {
            try {
                LocalDate dataFormatada = LocalDate.parse(data.toString());
                return dataFormatada.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            } catch (Exception ex) {
                return data.toString(); // fallback se não conseguir parsear
            }
        }
    }

    protected static String horaFormatada(Object hora) {
        try {
            LocalDateTime horaFormatada = LocalDateTime.parse(hora.toString());
            return horaFormatada.format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        } catch (Exception e) {
            return hora.toString(); // fallback se não conseguir parsear
        }
    }

    protected static String dataEHoraFormatada(Object dataEHora) {
        try {
            LocalDateTime dataEHoraFormatada = LocalDateTime.parse(dataEHora.toString());
            return dataEHoraFormatada.format(DateTimeFormatter.ofPattern("ddMMyyyy_HHmmss"));
        } catch (Exception e) {
            return dataEHora.toString(); // fallback se não conseguir parsear
        }
    }

    protected static String converteStatus(int status) {
        var statusList = new String[]{"Orçamento", "OS Aberta", "Serviço em Andamento", "Finalizada", "Cancelada"};
        return (status >= 1 && status <= 5) ? statusList[status - 1] : null;
    }

    protected static void cabeçalho(Document documento, String titulo) throws DocumentException {
        // --- Cabeçalho ---
        Paragraph paragrafoNomeEmpresa = new Paragraph();
        paragrafoNomeEmpresa.add(new Chunk(PdfService.nomeEmpresa, PdfService.helveticaNegrito10));
        documento.add(paragrafoNomeEmpresa);

        Paragraph paragrafoCNPJEmpresa = new Paragraph();
        paragrafoCNPJEmpresa.add(new Chunk("CNPJ: " + PdfService.cnpjEmpresa, PdfService.helveticaNormal10));
        documento.add(paragrafoCNPJEmpresa);
        documento.add(new Paragraph(" "));

        // --- TÍTULO ---
        Paragraph paragrafoTitulo = new Paragraph(titulo, new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD));
        paragrafoTitulo.setAlignment(Element.ALIGN_CENTER);
        documento.add(paragrafoTitulo);

        documento.add(new Paragraph(" "));
        documento.add(new LineSeparator());
    }

    protected static void dadosClienteVeiculo(Document documento, Map<String, Object> dados) throws DocumentException {
        // Extraindo dados do Map (vindo do Banco de Dados)
        String nomeCliente = dados != null && (dados.get("nome_cliente") != null) ? dados.get("nome_cliente").toString() : "N/A";
        String cpf = dados != null && (dados.get("cpf_cnpj") != null) ? dados.get("cpf_cnpj").toString() : "N/A";
        String celular = dados != null && (dados.get("celular") != null) ? dados.get("celular").toString() : "N/A";
        String telefone = dados != null && (dados.get("telefone") != null) ? dados.get("telefone").toString() : "N/A";

        String placa = dados != null && (dados.get("placa") != null) ? dados.get("placa").toString() : "N/A";
        String montadora = dados != null && (dados.get("montadora") != null) ? dados.get("montadora").toString() : "N/A";
        String modelo = dados != null && (dados.get("modelo") != null) ? dados.get("modelo").toString() : "N/A";
        String cor = dados != null && (dados.get("cor") != null) ? dados.get("cor").toString() : "N/A";
        String ano = dados != null && (dados.get("ano") != null) ? dados.get("ano").toString().substring(0, 4) : "N/A";
        String combustivel = dados != null && (dados.get("combustivel") != null) ? dados.get("combustivel").toString() : "N/A";
        
        // --- Dados do Cliente e do Veículo ---
        PdfPTable tabelaDados = new PdfPTable(2);
        tabelaDados.setWidthPercentage(100);
        tabelaDados.setSpacingBefore(5);
        tabelaDados.setSpacingAfter(12);

        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Dados do Cliente", "", PdfService.helveticaNegrito12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Dados do Veículo", "", PdfService.helveticaNegrito12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Nome", nomeCliente, PdfService.helveticaNormal12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Placa", placa, PdfService.helveticaNormal12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("CPF/CNPJ", cpf, PdfService.helveticaNormal12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Modelo", montadora + " " + modelo + " " + cor + " " + ano, PdfService.helveticaNormal12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Contato", celular != null ? celular : telefone != null ? telefone : "N/A", PdfService.helveticaNormal12));
        tabelaDados.addCell(PdfService.criarCelulaCabecalho("Combustível", combustivel, PdfService.helveticaNormal12));
        documento.add(tabelaDados);
    }

}