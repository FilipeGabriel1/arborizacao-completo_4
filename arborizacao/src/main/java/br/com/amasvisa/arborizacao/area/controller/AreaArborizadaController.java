package br.com.amasvisa.arborizacao.area.controller;

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

import br.com.amasvisa.arborizacao.area.models.AreaArborizadaRequest;
import br.com.amasvisa.arborizacao.area.models.AreaArborizadaResponse;
import br.com.amasvisa.arborizacao.area.service.AreaArborizadaService;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.comum.PaginaUtils;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/areas")
public class AreaArborizadaController {

    private final AreaArborizadaService service;

    public AreaArborizadaController(AreaArborizadaService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<AreaArborizadaResponse> criar(@RequestBody @Valid AreaArborizadaRequest request) {
        AreaArborizadaResponse response = service.criar(request);
        return ResponseEntity
                .created(URI.create("/api/areas/" + response.id()))
                .body(response);
    }

    @GetMapping
    public PaginaResponse<AreaArborizadaResponse> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return service.listar(nome, PaginaUtils.de(page, size));
    }

    @GetMapping("/{id}")
    public AreaArborizadaResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public AreaArborizadaResponse atualizar(@PathVariable Long id, @RequestBody @Valid AreaArborizadaRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }
}