package br.com.amasvisa.arborizacao.placar.models;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record PlacarArborizacaoResponse(
        long totalArvores,
        long totalDoadas,
        long totalDoacoes,
        long totalAreas,
        long totalEspecies,
        Map<String, Long> arvoresPorPorte,
        Map<String, Long> arvoresPorOrigem,
        Map<String, Long> arvoresPorStatus,
        List<DoacaoRecenteResponse> doacoesRecentes,
        LocalDateTime atualizadoEm
) {
}