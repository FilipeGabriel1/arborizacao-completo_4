package br.com.amasvisa.arborizacao.sementeira.models;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoteSementeiraRequest(
        @NotBlank String numeroLote,
        Long especieId,
        @NotNull Integer quantidadeProduzida,
        Integer quantidadeDisponivel,
        Integer quantidadeDoadas,
        Integer quantidadePlantadas,
        Integer quantidadePerdas,
        LocalDate dataProducao,
        String origemSementes,
        String observacoes,
        @NotNull StatusLote status
) {
}
