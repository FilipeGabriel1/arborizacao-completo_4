package br.com.amasvisa.arborizacao.usuario.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.usuario.models.UsuarioRequest;
import br.com.amasvisa.arborizacao.usuario.models.UsuarioResponse;
import br.com.amasvisa.arborizacao.usuario.service.UsuarioService;
import jakarta.validation.Valid;

/**
 * Cadastro de funcionários. Somente usuários com perfil ADMIN podem
 * criar, listar, ativar/desativar ou remover outros usuários.
 */
@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> criar(@RequestBody @Valid UsuarioRequest request) {
        UsuarioResponse response = service.criar(request);
        return ResponseEntity
                .created(URI.create("/api/usuarios/" + response.id()))
                .body(response);
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public UsuarioResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PatchMapping("/{id}/status")
    public UsuarioResponse atualizarStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        boolean ativo = Boolean.TRUE.equals(body.get("ativo"));
        return service.atualizarStatus(id, ativo);
    }

    @PatchMapping("/{id}/senha")
    public UsuarioResponse redefinirSenha(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String novaSenha = body.get("senha");
        if (novaSenha == null || novaSenha.length() < 6) {
            throw new IllegalArgumentException("A senha deve ter no mínimo 6 caracteres");
        }
        return service.redefinirSenha(id, novaSenha);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        service.remover(id);
    }
}
