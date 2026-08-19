package br.com.amasvisa.arborizacao.area.models;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AreaArborizadaRequest(
        @NotBlank String nome,
        String descricao,
        String fotoUrl,
        @NotNull TipoArea tipo,
        @NotNull AreaStatus status,
        Double latitude,
        Double longitude,
        List<PontoGeograficoDTO> pontos,
        List<AreaFotoRequest> fotos
) {
}