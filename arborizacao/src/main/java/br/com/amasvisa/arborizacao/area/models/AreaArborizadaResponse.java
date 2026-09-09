package br.com.amasvisa.arborizacao.area.models;

import java.time.LocalDateTime;
import java.util.List;

public record AreaArborizadaResponse(
        Long id,
        String nome,
        String descricao,
        String fotoUrl,
        TipoArea tipo,
        AreaStatus status,
        String bairro,
        String logradouro,
        Double areaTotalM2,
        String responsavelManutencao,
        SituacaoInventario situacaoInventario,
        Integer individuosCadastrados,
        LocalDateTime ultimaAtualizacaoInventario,
        Double latitude,
        Double longitude,
        List<PontoGeograficoDTO> pontos,
        List<AreaFotoResponse> fotos,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}