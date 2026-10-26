package br.com.amasvisa.arborizacao.config;

import java.io.IOException;
import java.util.Arrays;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CacheControlPublicoFilter extends OncePerRequestFilter {

    private static final String[] CAMINHOS_PUBLICOS = { "/api/areas", "/api/arvores", "/api/especies" };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if ("GET".equalsIgnoreCase(request.getMethod()) && !temCookieSessao(request)) {
            String uri = request.getRequestURI();
            for (String caminho : CAMINHOS_PUBLICOS) {
                if (uri.startsWith(caminho)) {
                    response.setHeader("Cache-Control", "public, max-age=60");
                    break;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private boolean temCookieSessao(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return false;
        }
        return Arrays.stream(request.getCookies())
                .anyMatch(cookie -> "JSESSIONID".equals(cookie.getName()));
    }
}
