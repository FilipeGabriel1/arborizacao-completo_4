package br.com.amasvisa.arborizacao.manutencao.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.comum.PaginaUtils;
import br.com.amasvisa.arborizacao.manutencao.models.ManutencaoArvoreRequest;
import br.com.amasvisa.arborizacao.manutencao.models.ManutencaoArvoreResponse;
import br.com.amasvisa.arborizacao.manutencao.service.ManutencaoArvoreService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/manutencoes")
public class ManutencaoArvoreController {

    private final ManutencaoArvoreService service;

    public ManutencaoArvoreController(ManutencaoArvoreService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ManutencaoArvoreResponse> criar(@Valid @RequestBody ManutencaoArvoreRequest request) {
        return ResponseEntity.ok(service.criar(request));
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<ManutencaoArvoreResponse>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(service.listar(PaginaUtils.de(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ManutencaoArvoreResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ManutencaoArvoreResponse> atualizar(@PathVariable Long id,
            @Valid @RequestBody ManutencaoArvoreRequest request) {
        return ResponseEntity.ok(service.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
