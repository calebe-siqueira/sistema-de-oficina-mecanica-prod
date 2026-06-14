package com.carbulab.service;

import java.time.LocalDateTime;
import java.io.ByteArrayOutputStream;

import org.springframework.stereotype.Service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;

import static com.carbulab.utils.ConvesorDeMap.obterDoMapa;

import java.util.List;
import java.util.Map;
import java.util.Collections;

@Service
public class PdfRelVeiculoService {
    
    // Método para gerar RELATÓRIO de Ordens de Serviço por veículo
    public byte[] gerarRelatorioOsPorVeiculo(Map<String, Object> dadosRelatorio) throws DocumentException {
        Document documento = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(documento, out);
            documento.open();

            // Verificação segura para evitar ClassCastException
            // Object dadosObj = dadosRelatorio.get("dados");
            // if (!(dadosObj instanceof Map)) {
            //     throw new IllegalArgumentException("Dados do relatório inválidos: 'dados' deve ser um Map.");
            // }
            @SuppressWarnings("unchecked")
            Map<String, Object> dados = (Map<String, Object>) dadosRelatorio.get("dados");

            // Conversão de Map para List de Map
            List<Map<String, Object>> ordens = obterDoMapa(dadosRelatorio, "ordens", Collections.emptyList());

            // --- Cabeçalho ---
            PdfService.cabeçalho(documento, "RELATÓRIO DE ORDENS DE SERVIÇO POR VEÍCULO");

            // --- Dados do Cliente e do Veículo ---
            PdfService.dadosClienteVeiculo(documento, dados);

            int totalDeOSs = ordens.size();
            Paragraph paragrafototalDeOSs = new Paragraph("Total de Ordens de Serviço: " + String.valueOf(totalDeOSs), PdfService.helveticaNormal12);
            paragrafototalDeOSs.setSpacingAfter(5);
            documento.add(paragrafototalDeOSs);
            documento.add(new LineSeparator());

            double totalRelatorio = 0;

            // Listagem das OSs
            for (int i = 0; i < totalDeOSs; i++) {
                String dataOs = PdfService.dataFormatada(ordens.get(i).get("data_OS") != null ? ordens.get(i).get("data_OS") : "N/A");
                String codOs = ordens.get(i).get("cod_OS") != null ? ordens.get(i).get("cod_OS").toString() : "N/A";
                String quilometragem = ordens.get(i).get("quilometragem") != null ? ordens.get(i).get("quilometragem").toString() : "N/A";
                String descricao = ordens.get(i).get("descricao") != null ? ordens.get(i).get("descricao").toString() : "N/A";
                String status = (ordens.get(i).get("status_servico") != null && !ordens.get(i).get("status_servico").toString().isEmpty()) ? PdfService.converteStatus(Integer.parseInt(ordens.get(i).get("status_servico").toString())) : "N/A";

                documento.add(new Paragraph(dataOs + " - OS nº " + codOs + " (" + quilometragem + " Km)", PdfService.helveticaNegrito12));
                documento.add(new Paragraph("Descrição: " + descricao, PdfService.helveticaNormal12));
                documento.add(new Paragraph("Status: " + status, PdfService.helveticaNormal12));
                
                // --- Itens ---
                if (ordens.get(i).get("itens") instanceof java.util.List) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> itens = (java.util.List<Map<String, Object>>) ordens.get(i).get("itens");
                    
                    if (!itens.isEmpty()) {
                        PdfPTable tabelaPecas = new PdfPTable(4);
                        tabelaPecas.setWidthPercentage(100);
                        tabelaPecas.setSpacingBefore(5);
                        tabelaPecas.addCell("Peça:");
                        tabelaPecas.addCell("Qtd:");
                        tabelaPecas.addCell("Valor Unit.:");
                        tabelaPecas.addCell("Subtotal:");
                        
                        PdfPTable tabelaServicos = new PdfPTable(4);
                        tabelaServicos.setWidthPercentage(100);
                        tabelaServicos.setSpacingBefore(5);
                        tabelaServicos.setSpacingAfter(5);
                        tabelaServicos.addCell("Serviço:");
                        tabelaServicos.addCell("Qtd:");
                        tabelaServicos.addCell("Valor Unit.:");
                        tabelaServicos.addCell("Subtotal:");

                        double totalPorOs = 0;
                        for (Map<String, Object> item : itens) {
                            String nomeItem = item.getOrDefault("nome_item", item.getOrDefault("nome", "-")) != null
                                    ? item.getOrDefault("nome_item", item.getOrDefault("nome", "-")).toString() : "-";
                            Number quantidade = item.get("quantidade") instanceof Number ? (Number) item.get("quantidade") : 0;
                            Number valorUnitario = item.get("valor") instanceof Number ? (Number) item.get("valor") : 0;
                            String tipo = item.getOrDefault("tipo", "").toString();

                            double totalItem = quantidade.doubleValue() * valorUnitario.doubleValue();
                            totalPorOs += totalItem;

                            if (tipo.equalsIgnoreCase("P")) {
                                tabelaPecas.addCell(nomeItem);
                                tabelaPecas.addCell(String.valueOf(quantidade));
                                tabelaPecas.addCell(String.format("R$ %.2f", valorUnitario.doubleValue()));
                                tabelaPecas.addCell(String.format("R$ %.2f", totalItem));
                            } else {
                                tabelaServicos.addCell(nomeItem);
                                tabelaServicos.addCell(String.valueOf(quantidade));
                                tabelaServicos.addCell(String.format("R$ %.2f", valorUnitario.doubleValue()));
                                tabelaServicos.addCell(String.format("R$ %.2f", totalItem));
                            }
                        }

                        documento.add(new Paragraph("Peças:", PdfService.helveticaNegrito12));
                        documento.add(tabelaPecas);

                        documento.add(new Paragraph("Serviços:", PdfService.helveticaNegrito12));
                        documento.add(tabelaServicos);

                        Paragraph paragrafoTotal = new Paragraph("Valor da OS: R$ " + String.format("%.2f", totalPorOs), PdfService.helveticaNormal12);
                        paragrafoTotal.setAlignment(Element.ALIGN_RIGHT);
                        paragrafoTotal.setSpacingAfter(5);
                        documento.add(paragrafoTotal);

                        totalRelatorio += totalPorOs;
                    } else {
                        documento.add(new Paragraph("Itens: nenhum item registrado."));
                    }
                } else {
                    documento.add(new Paragraph("Itens: não disponível."));
                }
                // Divisória entre as OSs
                Paragraph paragrafoEspaçamento10 = new Paragraph("");
                paragrafoEspaçamento10.setSpacingAfter(10);
                documento.add(paragrafoEspaçamento10);
                documento.add(new LineSeparator());
            }

            Paragraph total = new Paragraph("Somatório total: R$ " + String.format("%.2f", totalRelatorio), PdfService.helveticaNegrito12);
            total.setAlignment(Element.ALIGN_RIGHT);
            documento.add(new Paragraph(" "));
            documento.add(total);

            LocalDateTime dataEHoraCorrente = LocalDateTime.now();
            String dataCorrente = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(dataEHoraCorrente);
            String horaCorrente = java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss").format(dataEHoraCorrente);
            documento.add(new Paragraph(" "));
            documento.add(new LineSeparator());
            Paragraph paragrafoAssinatura = new Paragraph();
            paragrafoAssinatura.setAlignment(Element.ALIGN_RIGHT);
            paragrafoAssinatura.add(new Chunk(("Emitido por Mecânica Carbulab em " + dataCorrente + " às " + horaCorrente), PdfService.helveticaNormal10));
            documento.add(paragrafoAssinatura);


        } catch (DocumentException e) {
            throw new DocumentException("Erro ao gerar PDF: " + e.getMessage(), e);
        } finally {
            documento.close();
        }

        return out.toByteArray();
    }

}
