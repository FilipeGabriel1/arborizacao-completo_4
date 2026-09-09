package br.com.amasvisa.arborizacao.sementeira.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LoteSementeiraResponse(
        Long id,
        String numeroLote,
        Long especieId,
        String especieNomePopular,
        Integer quantidadeProduzida,
        Integer quantidadeDisponivel,
        Integer quantidadeDoadas,
        Integer quantidadePlantadas,
        Integer quantidadePerdas,
        LocalDate dataProducao,
        String origemSementes,
        String observacoes,
        StatusLote status,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
