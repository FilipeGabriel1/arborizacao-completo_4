package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDateTime;

public record ArvoreFotoResponse(
        Long id,
        String url,
        String descricao,
        LocalDateTime criadoEm
) {
}