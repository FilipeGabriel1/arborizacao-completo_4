package br.com.amasvisa.arborizacao.placar.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ArvoreRecenteResponse(
        Long id,
        String nome,
        String especieNomePopular,
        String porte,
        String origem,
        LocalDate dataPlantio,
        LocalDateTime criadoEm
) {
}
