package br.com.amasvisa.arborizacao.area.models;

import java.time.LocalDateTime;

public record AreaFotoResponse(
        Long id,
        String url,
        String descricao,
        LocalDateTime criadoEm
) {
}