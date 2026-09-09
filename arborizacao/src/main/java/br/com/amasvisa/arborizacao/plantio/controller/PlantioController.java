package br.com.amasvisa.arborizacao.plantio.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.comum.PaginaUtils;
import br.com.amasvisa.arborizacao.plantio.models.PlantioRequest;
import br.com.amasvisa.arborizacao.plantio.models.PlantioResponse;
import br.com.amasvisa.arborizacao.plantio.service.PlantioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/plantios")
public class PlantioController {

    private final PlantioService service;

    public PlantioController(PlantioService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<PlantioResponse> criar(@Valid @RequestBody PlantioRequest request) {
        return ResponseEntity.ok(service.criar(request));
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<PlantioResponse>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(service.listar(PaginaUtils.de(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlantioResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlantioResponse> atualizar(@PathVariable Long id,
            @Valid @RequestBody PlantioRequest request) {
        return ResponseEntity.ok(service.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
