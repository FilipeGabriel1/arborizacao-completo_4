package br.com.amasvisa.arborizacao.area.models;

import jakarta.validation.constraints.NotNull;

public record PontoGeograficoDTO(
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}