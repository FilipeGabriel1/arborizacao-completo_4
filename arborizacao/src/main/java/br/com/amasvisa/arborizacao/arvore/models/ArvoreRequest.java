package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotNull;

public record ArvoreRequest(
        Long areaId,
        Long especieId,
        String nome,
        @NotNull TipoArvore tipoArvore,
        @NotNull PorteArvore porte,
        @NotNull OrigemArvore origem,
        @NotNull StatusArvore status,
        boolean georreferenciada,
        Double latitude,
        Double longitude,
        LocalDate dataPlantio,
        String numeroProcesso,
        String descricao,
        String fotoUrl,
        List<ArvoreFotoRequest> fotos
) {
}