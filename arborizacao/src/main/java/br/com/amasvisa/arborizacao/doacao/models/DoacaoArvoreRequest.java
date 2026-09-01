package br.com.amasvisa.arborizacao.doacao.models;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record DoacaoArvoreRequest(
        @NotNull Long arvoreId,
        String descricao,
        String solicitante,
        LocalDate dataDoacao,
        String destinacao,
        Integer quantidade,
        String cpf,
        String rg
) {
    @AssertTrue(message = "CPF inválido")
    public boolean isCpfValido() {
        if (cpf == null || cpf.isBlank()) {
            return true;
        }
        String nums = cpf.replaceAll("\\D", "");
        if (nums.length() != 11) {
            return false;
        }
        if (nums.chars().distinct().count() == 1) {
            return false;
        }
        int d1 = 0;
        for (int i = 0; i < 9; i++) {
            d1 += (nums.charAt(i) - '0') * (10 - i);
        }
        d1 = 11 - (d1 % 11);
        if (d1 >= 10) d1 = 0;
        if ((nums.charAt(9) - '0') != d1) {
            return false;
        }
        int d2 = 0;
        for (int i = 0; i < 10; i++) {
            d2 += (nums.charAt(i) - '0') * (11 - i);
        }
        d2 = 11 - (d2 % 11);
        if (d2 >= 10) d2 = 0;
        return (nums.charAt(10) - '0') == d2;
    }
}
