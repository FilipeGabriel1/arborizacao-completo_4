package br.com.amasvisa.arborizacao.auditoria.models;

import java.time.LocalDateTime;

public record AuditoriaResponse(
        Long id,
        LocalDateTime dataHora,
        String usuarioEmail,
        AcaoAuditoria acao,
        TipoEntidadeAuditoria entidade,
        Long entidadeId,
        String detalhe
) {
}