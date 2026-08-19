package br.com.amasvisa.arborizacao.arvore.models;

import jakarta.validation.constraints.NotBlank;

public record EspecieArvoreRequest(
        @NotBlank String nomePopular,
        String nomeCientifico,
        String familia,
        String portePadrao,
        String observacoes
) {
}