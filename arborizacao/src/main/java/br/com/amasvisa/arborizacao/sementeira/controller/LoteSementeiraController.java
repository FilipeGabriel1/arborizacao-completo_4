package br.com.amasvisa.arborizacao.sementeira.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.comum.PaginaUtils;
import br.com.amasvisa.arborizacao.sementeira.models.LoteSementeiraRequest;
import br.com.amasvisa.arborizacao.sementeira.models.LoteSementeiraResponse;
import br.com.amasvisa.arborizacao.sementeira.service.LoteSementeiraService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sementeira")
public class LoteSementeiraController {

    private final LoteSementeiraService service;

    public LoteSementeiraController(LoteSementeiraService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<LoteSementeiraResponse> criar(@Valid @RequestBody LoteSementeiraRequest request) {
        return ResponseEntity.ok(service.criar(request));
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<LoteSementeiraResponse>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(service.listar(PaginaUtils.de(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoteSementeiraResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LoteSementeiraResponse> atualizar(@PathVariable Long id,
            @Valid @RequestBody LoteSementeiraRequest request) {
        return ResponseEntity.ok(service.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
