package br.com.amasvisa.arborizacao.plantio.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PlantioResponse(
        Long id,
        Long areaId,
        String areaNome,
        Long especieId,
        String especieNomePopular,
        Integer quantidadeMudas,
        LocalDate dataPlantio,
        String responsavel,
        String descricao,
        StatusPlantio status,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
