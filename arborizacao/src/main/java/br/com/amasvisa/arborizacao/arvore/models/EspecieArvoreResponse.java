package br.com.amasvisa.arborizacao.arvore.models;

import java.time.LocalDateTime;

public record EspecieArvoreResponse(
        Long id,
        String nomePopular,
        String nomeCientifico,
        String familia,
        String portePadrao,
        String observacoes,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}