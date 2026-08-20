package br.com.amasvisa.arborizacao.placar.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.placar.models.PlacarArborizacaoResponse;
import br.com.amasvisa.arborizacao.placar.service.PlacarService;

@RestController
@RequestMapping("/api/placar")
public class PlacarController {

    private final PlacarService service;

    public PlacarController(PlacarService service) {
        this.service = service;
    }

    @GetMapping
    public PlacarArborizacaoResponse obter() {
        return service.obter();
    }
}