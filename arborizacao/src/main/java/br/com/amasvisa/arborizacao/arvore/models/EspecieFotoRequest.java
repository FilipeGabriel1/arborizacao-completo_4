package br.com.amasvisa.arborizacao.arvore.models;

import jakarta.validation.constraints.NotBlank;

public record EspecieFotoRequest(
        @NotBlank String url,
        String descricao
) {
}