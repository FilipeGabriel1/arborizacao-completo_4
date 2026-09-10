package br.com.amasvisa.arborizacao.manutencao.models;

import java.time.LocalDate;

import br.com.amasvisa.arborizacao.arvore.models.PrioridadeManejo;
import br.com.amasvisa.arborizacao.arvore.models.TipoManejo;
import jakarta.validation.constraints.NotNull;

public record ManutencaoArvoreRequest(
        String endereco,
        @NotNull TipoManejo tipo,
        @NotNull PrioridadeManejo prioridade,
        LocalDate dataAgendada,
        LocalDate dataExecucao,
        String responsavelExecucao,
        String observacoes,
        @NotNull String status
) {
}
