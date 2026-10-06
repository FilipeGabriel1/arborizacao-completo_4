package br.com.amasvisa.arborizacao.config;

import java.io.IOException;

import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Redireciona requisições HTTP (porta auxiliar, ex.: 8080) para HTTPS
 * (porta principal, ex.: 8443), preservando caminho, query e método.
 *
 * Mantém o hábito antigo de digitar http://localhost:8080 funcionando:
 * o navegador é enviado automaticamente para https://localhost:8443.
 */
public class HttpsRedirectFilter extends OncePerRequestFilter {

    private final int httpsPort;

    public HttpsRedirectFilter(int httpsPort) {
        this.httpsPort = httpsPort;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (request.isSecure()) {
            filterChain.doFilter(request, response);
            return;
        }

        StringBuilder url = new StringBuilder("https://")
                .append(request.getServerName())
                .append(':').append(httpsPort)
                .append(request.getRequestURI());
        if (request.getQueryString() != null) {
            url.append('?').append(request.getQueryString());
        }
        // 307: preserva o método (POST/PUT) e não é cacheado agressivamente
        // como o 308, o que facilita desligar o SSL depois sem redirect velho.
        response.setStatus(HttpServletResponse.SC_TEMPORARY_REDIRECT);
        response.setHeader("Location", url.toString());
    }
}
