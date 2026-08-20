package br.com.amasvisa.arborizacao.doacao.models;

import java.time.LocalDate;
import java.util.List;

public record ExtratoDoadorResponse(
        String solicitante,
        String cpf,
        String rg,
        long totalDoacoes,
        long totalQuantidade,
        LocalDate dataPrimeiraDoacao,
        LocalDate dataUltimaDoacao,
        List<DoacaoArvoreResponse> movimentacoes
) {
}