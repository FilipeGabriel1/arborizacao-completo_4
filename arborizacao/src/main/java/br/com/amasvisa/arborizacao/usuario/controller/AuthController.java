package br.com.amasvisa.arborizacao.usuario.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.amasvisa.arborizacao.usuario.models.Usuario;
import br.com.amasvisa.arborizacao.usuario.repository.UsuarioRepository;

/**
 * Endpoint simples para o front-end saber quem está logado
 * e se deve mostrar as telas restritas a ADMIN.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository repository;

    public AuthController(UsuarioRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/me")
    public UsuarioLogado me(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);

        Usuario usuario = repository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
        String nome = usuario != null ? usuario.getNome() : null;
        String perfil = usuario != null && usuario.getPerfil() != null ? usuario.getPerfil().name() : null;

        return new UsuarioLogado(authentication.getName(), isAdmin, nome, perfil);
    }

    public record UsuarioLogado(String email, boolean admin, String nome, String perfil) {
    }
}
