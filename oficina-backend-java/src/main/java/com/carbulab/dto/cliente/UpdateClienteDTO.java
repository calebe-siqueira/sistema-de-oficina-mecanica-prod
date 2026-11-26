package com.carbulab.dto.cliente;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;

import com.carbulab.dto.common.PatchField;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.Valid;

/**
 * DTO para atualização parcial de cliente.
 *
 * <p>Utiliza {@link PatchField} para distinguir campos omitidos na requisição
 * de campos enviados explicitamente com valor {@code null}.</p>
 */
public record UpdateClienteDTO(
    PatchField<String> nome_cliente,
    PatchField<String> email,
    PatchField<String> celular,
    PatchField<String> telefone,
    PatchField<String> rg,
    PatchField<String> cpf_cnpj,
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    PatchField<LocalDate> data_nascimento,
    PatchField<Character> tipo,
    PatchField<@Valid EnderecoDTO> endereco
) {
    public UpdateClienteDTO {
        nome_cliente = PatchField.safe(nome_cliente);
        email = PatchField.safe(email);
        celular = PatchField.safe(celular);
        telefone = PatchField.safe(telefone);
        rg = PatchField.safe(rg);
        cpf_cnpj = PatchField.safe(cpf_cnpj);
        data_nascimento = PatchField.safe(data_nascimento);
        tipo = PatchField.safe(tipo);
        endereco = PatchField.safe(endereco);
    }

    /**
     * DTO para dados de endereço (atualização parcial).
     */
    public record EnderecoDTO(
        PatchField<String> cep,
        PatchField<String> logradouro,
        PatchField<Integer> numero,
        PatchField<String> complemento,
        PatchField<String> bairro,
        PatchField<String> cidade,
        PatchField<String> uf
    ) {
        public EnderecoDTO {
            cep = PatchField.safe(cep);
            logradouro = PatchField.safe(logradouro);
            numero = PatchField.safe(numero);
            complemento = PatchField.safe(complemento);
            bairro = PatchField.safe(bairro);
            cidade = PatchField.safe(cidade);
            uf = PatchField.safe(uf);
        }
    }
}
