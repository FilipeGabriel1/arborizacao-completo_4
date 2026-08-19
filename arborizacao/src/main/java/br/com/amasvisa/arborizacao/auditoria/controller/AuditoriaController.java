package br.com.amasvisa.arborizacao.auditoria.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.auditoria.models.AuditoriaResponse;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;

@RestController
@RequestMapping("/api/auditoria")
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {

    private final AuditoriaService service;

    public AuditoriaController(AuditoriaService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuditoriaResponse> listar() {
        return service.listar();
    }
}