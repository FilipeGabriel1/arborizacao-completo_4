package br.com.amasvisa.arborizacao.arvore.models;

import jakarta.validation.constraints.NotBlank;

public record ArvoreFotoRequest(
        @NotBlank String url,
        String descricao
) {
}