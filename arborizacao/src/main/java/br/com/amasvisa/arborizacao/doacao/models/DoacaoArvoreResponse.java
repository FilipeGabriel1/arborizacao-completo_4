package br.com.amasvisa.arborizacao.doacao.models;

import java.time.LocalDate;

public record DoacaoArvoreResponse(
        Long id,
        Long arvoreId,
        String arvoreNome,
        String arvoreEspecie,
        String descricao,
        String solicitante,
        LocalDate dataDoacao,
        String destinacao,
        Integer quantidade,
        String cpf,
        String rg
) {
}
