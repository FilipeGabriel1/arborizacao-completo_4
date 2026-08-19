package br.com.amasvisa.arborizacao.arvore.controller;

import java.net.URI;

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

import br.com.amasvisa.arborizacao.arvore.models.EspecieArvoreRequest;
import br.com.amasvisa.arborizacao.arvore.models.EspecieArvoreResponse;
import br.com.amasvisa.arborizacao.arvore.service.EspecieArvoreService;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.comum.PaginaUtils;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/especies")
public class EspecieArvoreController {

    private final EspecieArvoreService service;

    public EspecieArvoreController(EspecieArvoreService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EspecieArvoreResponse> criar(@RequestBody @Valid EspecieArvoreRequest request) {
        EspecieArvoreResponse response = service.criar(request);
        return ResponseEntity.created(URI.create("/api/especies/" + response.id())).body(response);
    }

    @GetMapping
    public PaginaResponse<EspecieArvoreResponse> listar(
            @RequestParam(required = false) String nomePopular,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return service.listar(nomePopular, PaginaUtils.de(page, size));
    }

    @GetMapping("/{id}")
    public EspecieArvoreResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public EspecieArvoreResponse atualizar(@PathVariable Long id, @RequestBody @Valid EspecieArvoreRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }
}