package br.com.amasvisa.arborizacao.plantio.models;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record PlantioRequest(
        Long areaId,
        Long especieId,
        @NotNull Integer quantidadeMudas,
        LocalDate dataPlantio,
        String responsavel,
        String descricao,
        @NotNull StatusPlantio status
) {
}
