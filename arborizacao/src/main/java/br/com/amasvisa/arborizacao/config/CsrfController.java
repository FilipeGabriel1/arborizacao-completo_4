package br.com.amasvisa.arborizacao.config;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint público que expõe o token CSRF. Ao ser acessado, o Spring
 * escreve o cookie XSRF-TOKEN na resposta. O front-end estático
 * (/arborizacao/csrf.js) usa esse cookie para enviar o header
 * X-XSRF-TOKEN nas requisições de escrita (POST/PUT/PATCH/DELETE).
 */
@RestController
@RequestMapping("/api")
public class CsrfController {

    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }
}