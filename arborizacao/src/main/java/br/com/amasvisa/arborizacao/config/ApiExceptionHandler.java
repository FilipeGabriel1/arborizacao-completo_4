package br.com.amasvisa.arborizacao.config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }

    // Pega qualquer outro erro (ex: violação de constraint no banco) e devolve
    // a mensagem real em vez de um 500 sem detalhe nenhum. Só recomendado
    // enquanto o projeto é interno/em desenvolvimento — em produção, prefira
    // não expor detalhes internos assim.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("Erro não tratado", ex);
        String causaRaiz = causaRaiz(ex).getMessage();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", ex.getClass().getSimpleName() + ": " + causaRaiz));
    }

    private Throwable causaRaiz(Throwable ex) {
        Throwable atual = ex;
        while (atual.getCause() != null && atual.getCause() != atual) {
            atual = atual.getCause();
        }
        return atual;
    }
}
