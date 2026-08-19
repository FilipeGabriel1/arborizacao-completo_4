package br.com.amasvisa.arborizacao.doacao.controller;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvoreRequest;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvoreResponse;
import br.com.amasvisa.arborizacao.doacao.service.DoacaoArvoreService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doacoes")
public class DoacaoArvoreController {

    private final DoacaoArvoreService service;

    public DoacaoArvoreController(DoacaoArvoreService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<DoacaoArvoreResponse> criar(@RequestBody @Valid DoacaoArvoreRequest request) {
        DoacaoArvoreResponse response = service.criar(request);
        return ResponseEntity.created(URI.create("/api/doacoes/" + response.id())).body(response);
    }

    @GetMapping
    public List<DoacaoArvoreResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public DoacaoArvoreResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public DoacaoArvoreResponse atualizar(@PathVariable Long id, @RequestBody @Valid DoacaoArvoreRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }
}
