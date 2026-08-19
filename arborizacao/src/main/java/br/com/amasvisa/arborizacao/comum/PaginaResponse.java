package br.com.amasvisa.arborizacao.comum;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * Envelope de resposta paginada. O campo "value" contém os itens da página
 * atual, mantendo compatibilidade com o front-end estático (data.value ?? []).
 */
public record PaginaResponse<T>(
        List<T> value,
        int page,
        int size,
        long totalElements,
        int totalPages
) {

    public static <T> PaginaResponse<T> of(Page<T> page) {
        return new PaginaResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}