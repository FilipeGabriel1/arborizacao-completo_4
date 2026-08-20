package br.com.amasvisa.arborizacao.placar.models;

import java.time.LocalDate;

public record DoacaoRecenteResponse(
        Long id,
        String solicitante,
        String descricao,
        Integer quantidade,
        LocalDate dataDoacao,
        String especieNomePopular
) {
}