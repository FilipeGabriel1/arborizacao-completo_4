package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDateTime;
import java.util.List;

public record EspecieArvoreResponse(
        Long id,
        String nomePopular,
        String nomeCientifico,
        String familia,
        String portePadrao,
        String observacoes,
        String indicacaoPlantio,
        String fotoUrl,
        List<EspecieFotoResponse> fotos,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}