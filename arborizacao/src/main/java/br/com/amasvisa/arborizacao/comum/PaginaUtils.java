package br.com.amasvisa.arborizacao.comum;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * Monta um Pageable a partir dos parâmetros de requisição, limitando
 * o tamanho máximo da página para evitar consultas gigantescas.
 */
public final class PaginaUtils {

    public static final int TAMANHO_PADRAO = 50;
    public static final int TAMANHO_MAXIMO = 500;

    private PaginaUtils() {
    }

    public static Pageable de(int page, int size) {
        int paginaSegura = Math.max(page, 0);
        int tamanhoSeguro = Math.max(1, Math.min(size, TAMANHO_MAXIMO));
        return PageRequest.of(paginaSegura, tamanhoSeguro);
    }
}