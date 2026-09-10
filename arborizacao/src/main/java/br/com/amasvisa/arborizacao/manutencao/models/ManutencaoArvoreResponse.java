package br.com.amasvisa.arborizacao.manutencao.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.amasvisa.arborizacao.arvore.models.PrioridadeManejo;
import br.com.amasvisa.arborizacao.arvore.models.TipoManejo;

public record ManutencaoArvoreResponse(
        Long id,
        String endereco,
        TipoManejo tipo,
        PrioridadeManejo prioridade,
        LocalDate dataAgendada,
        LocalDate dataExecucao,
        String responsavelExecucao,
        String observacoes,
        String status,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
