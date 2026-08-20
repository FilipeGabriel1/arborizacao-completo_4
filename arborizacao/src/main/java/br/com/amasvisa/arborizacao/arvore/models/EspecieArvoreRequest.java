package br.com.amasvisa.arborizacao.arvore.models;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record EspecieArvoreRequest(
        @NotBlank String nomePopular,
        String nomeCientifico,
        String familia,
        String portePadrao,
        String observacoes,
        String indicacaoPlantio,
        String fotoUrl,
        List<EspecieFotoRequest> fotos
) {
}