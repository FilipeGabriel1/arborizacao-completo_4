package br.com.amasvisa.arborizacao.doacao.models;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record DoacaoArvoreRequest(
        @NotNull Long arvoreId,
        String descricao,
        String solicitante,
        LocalDate dataDoacao,
        String destinacao,
        Integer quantidade,
        String cpf,
        String rg
) {
}
