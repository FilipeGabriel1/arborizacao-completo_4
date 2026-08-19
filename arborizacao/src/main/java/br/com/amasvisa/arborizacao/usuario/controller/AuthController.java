package br.com.amasvisa.arborizacao.usuario.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint simples para o front-end saber quem está logado
 * e se deve mostrar as telas restritas a ADMIN.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public UsuarioLogado me(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);

        return new UsuarioLogado(authentication.getName(), isAdmin);
    }

    public record UsuarioLogado(String email, boolean admin) {
    }
}
