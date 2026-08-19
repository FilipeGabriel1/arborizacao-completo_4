package br.com.amasvisa.arborizacao.arvore.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.arvore.models.ArvoreRequest;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreResponse;
import br.com.amasvisa.arborizacao.arvore.service.ArvoreService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/arvores")
public class ArvoreController {

    private final ArvoreService service;

    public ArvoreController(ArvoreService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ArvoreResponse> criar(@RequestBody @Valid ArvoreRequest request) {
        ArvoreResponse response = service.criar(request);
        return ResponseEntity.created(URI.create("/api/arvores/" + response.id())).body(response);
    }

    @GetMapping
    public List<ArvoreResponse> listar(
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long especieId,
            @RequestParam(required = false) String nome) {
        return service.listar(areaId, especieId, nome);
    }

    @GetMapping("/{id}")
    public ArvoreResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public ArvoreResponse atualizar(@PathVariable Long id, @RequestBody @Valid ArvoreRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }
}