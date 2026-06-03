package com.carbulab.service;

import java.time.LocalDateTime;
import java.util.Map;
import java.io.ByteArrayOutputStream;

import org.springframework.stereotype.Service;

import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;

import com.itextpdf.text.*;


@Service
public class PdfOsService {
    
    // Método adaptado de GerarPdf.java para retornar bytes em vez de salvar arquivo
    public static byte[] gerarOsPdf(Map<String, Object> dadosOs) throws DocumentException {
        Document documento = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(documento, out);
            documento.open();
            
            documento.addTitle("OS " + dadosOs.get("cod_OS") + " Carbulab - " + PdfService.dataEHoraFormatada(LocalDateTime.now()));
            documento.addAuthor(PdfService.nomeEmpresa);
            
            String codigoOS = (dadosOs.get("cod_OS") != null) ? dadosOs.get("cod_OS").toString() : null;
            Object dataOs = dadosOs.get("data_OS");
            String quilometragem = (dadosOs.get("quilometragem") != null) ? dadosOs.get("quilometragem").toString() : null;
            String descricao = (dadosOs.get("descricao") != null) ? dadosOs.get("descricao").toString() : null;
            String status = PdfService.converteStatus(Integer.parseInt(dadosOs.get("status").toString())) != null ? PdfService.converteStatus(Integer.parseInt(dadosOs.get("status").toString())) : "N/A";
            double valorPago = (dadosOs.get("valor_pago") != null) ? Double.parseDouble(dadosOs.get("valor_pago").toString()) : 0;
            String tipoDesconto = (dadosOs.get("tipo_desconto") != null) ? dadosOs.get("tipo_desconto").toString() : null;
            double desconto = dadosOs.get("desconto") instanceof Number ? ((Number) dadosOs.get("desconto")).doubleValue() : 0;

            // --- Cabeçalho ---
            PdfService.cabeçalho(documento, "ORDEM DE SERVIÇO");

            // --- Dados do Cliente e do Veículo ---
            PdfService.dadosClienteVeiculo(documento, dadosOs);

            documento.add(new LineSeparator());

            // --- Detalhes da OS ---
            documento.add(new Paragraph("Detalhes da OS:", PdfService.helveticaNegrito12));
            documento.add(new Paragraph("Código: " + (codigoOS != null ? codigoOS : "N/A")));
            
            dataOs = PdfService.dataFormatada(dataOs);
            documento.add(new Paragraph("Data: " + (dataOs != null ? dataOs : "N/A")));
            documento.add(new Paragraph("Quilometragem: " + (quilometragem != null ? (quilometragem + " km") : "N/A")));
            documento.add(new Paragraph("Descrição: " + (descricao != null ? descricao : "N/A")));
            documento.add(new Paragraph("Status: " + (status.trim() != "" ? status : "N/A")));
            documento.add(new Paragraph(" "));

            // --- Itens ---
            if (dadosOs.get("itens") instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> itens = (java.util.List<Map<String, Object>>) dadosOs.get("itens");

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

                    double somaTotal = 0;
                    for (Map<String, Object> item : itens) {
                        String nomeItem = item.getOrDefault("nome_item", item.getOrDefault("nome", "-")) != null
                                ? item.getOrDefault("nome_item", item.getOrDefault("nome", "-")).toString()
                                : "-";
                        Number quantidade = item.get("quantidade") instanceof Number ? (Number) item.get("quantidade")
                                : 0;
                        Number valorUnitario = item.get("valor") instanceof Number ? (Number) item.get("valor") : 0;
                        String tipo = item.getOrDefault("tipo", "").toString();

                        double totalItem = quantidade.doubleValue() * valorUnitario.doubleValue();
                        somaTotal += totalItem;

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

                    // Valor Total da OS
                    Paragraph paragrafoTotal = new Paragraph();
                    paragrafoTotal.setAlignment(Element.ALIGN_RIGHT);
                    paragrafoTotal.add(new Chunk("Total: R$ " + String.format("%.2f", somaTotal), PdfService.helveticaNegrito12));
                    documento.add(paragrafoTotal);

                    // Desconto
                    double valorDesconto = tipoDesconto != null && tipoDesconto.equalsIgnoreCase("P")
                            ? Math.max(0, somaTotal * desconto / 100.0)
                            : desconto;
                    Paragraph paragrafoDesconto = new Paragraph();
                    paragrafoDesconto.setAlignment(Element.ALIGN_RIGHT);
                    paragrafoDesconto.add(new Chunk("Desconto: R$ " + String.format("%.2f", valorDesconto), PdfService.helveticaNormal12));
                    documento.add(paragrafoDesconto);

                    // Valor Final (com desconto aplicado)
                    double valorComDesconto = tipoDesconto != null && tipoDesconto.equalsIgnoreCase("P")
                            ? Math.max(0, somaTotal - (somaTotal * desconto / 100.0))
                            : Math.max(0, somaTotal - desconto);
                    Paragraph paragrafoValorFinal = new Paragraph();
                    paragrafoValorFinal.setAlignment(Element.ALIGN_RIGHT);
                    paragrafoValorFinal.add(new Chunk("Valor Final: R$ " + String.format("%.2f", valorComDesconto), PdfService.helveticaNormal12));
                    documento.add(paragrafoValorFinal);

                    // Valor Pago/
                    // if (valorPago > 0) { // Exibe o valor pago, se houver
                    //     Paragraph paragrafoValorPago = new Paragraph("Valor Pago: R$ " + String.format("%.2f", valorPago), helveticaNormal12);
                    //     paragrafoValorPago.setAlignment(Element.ALIGN_LEFT);
                    //     documento.add(paragrafoValorPago);
                    // }
                    if (valorPago >= valorComDesconto) { // Exibe se a OS foi paga (integralmente)
                        Paragraph paragrafoValorPago = new Paragraph("PAGO", PdfService.helveticaNormal12);
                        paragrafoValorPago.setAlignment(Element.ALIGN_LEFT);
                        documento.add(paragrafoValorPago);
                    }
                } else {
                    documento.add(new Paragraph("Itens: nenhum item registrado."));
                }
            } else {
                documento.add(new Paragraph("Itens: não disponível."));
            }

            // Rodapé
            documento.add(new Paragraph(" "));
            documento.add(new LineSeparator());

            String dataCorrente = PdfService.dataFormatada(LocalDateTime.now());
            String horaCorrente = PdfService.horaFormatada(LocalDateTime.now());
            Paragraph paragrafoAssinatura = new Paragraph(String.format("Emitido por %s em %s às %s", PdfService.nomeEmpresa, dataCorrente, horaCorrente), PdfService.helveticaNormal10);
            paragrafoAssinatura.setAlignment(Element.ALIGN_RIGHT);
            documento.add(paragrafoAssinatura);

        } finally {
            documento.close();
        }
        return out.toByteArray();
    }

}
