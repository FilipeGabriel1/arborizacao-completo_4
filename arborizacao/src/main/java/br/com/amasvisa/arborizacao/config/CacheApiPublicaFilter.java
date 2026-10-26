package br.com.amasvisa.arborizacao.config;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CacheApiPublicaFilter extends OncePerRequestFilter {

    private static final long TTL_MS = 30_000;
    private static final long TAMANHO_MAXIMO = 1_000_000;
    private static final String[] CAMINHOS_PUBLICOS = { "/api/areas", "/api/arvores", "/api/especies" };

    private record Entrada(byte[] corpo, String contentType, long expiraEm) {
    }

    private final ConcurrentHashMap<String, Entrada> cache = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        boolean elegivel = "GET".equalsIgnoreCase(request.getMethod())
                && !temCookie(request, "JSESSIONID")
                && caminhoPublico(uri);

        if (!elegivel) {
            chain.doFilter(request, response);
            return;
        }

        String chave = uri + (request.getQueryString() != null ? "?" + request.getQueryString() : "");
        long agora = System.currentTimeMillis();
        Entrada hit = cache.get(chave);
        if (hit != null && hit.expiraEm() > agora) {
            response.setStatus(200);
            if (hit.contentType() != null) {
                response.setContentType(hit.contentType());
            }
            response.setContentLength(hit.corpo().length);
            response.getOutputStream().write(hit.corpo());
            return;
        }

        CorpoCapturado capturado = new CorpoCapturado(response);
        chain.doFilter(request, capturado);

        byte[] corpo = capturado.buffer.toByteArray();
        if (capturado.status == 200 && corpo.length > 0 && corpo.length < TAMANHO_MAXIMO) {
            cache.put(chave, new Entrada(corpo, capturado.contentType, agora + TTL_MS));
        }

        response.setContentLength(corpo.length);
        response.getOutputStream().write(corpo);
    }

    private boolean caminhoPublico(String uri) {
        for (String caminho : CAMINHOS_PUBLICOS) {
            if (uri.startsWith(caminho)) {
                return true;
            }
        }
        return false;
    }

    private boolean temCookie(HttpServletRequest request, String nome) {
        if (request.getCookies() == null) {
            return false;
        }
        return Arrays.stream(request.getCookies()).anyMatch(cookie -> nome.equals(cookie.getName()));
    }

    private static final class CorpoCapturado extends HttpServletResponseWrapper {

        private final ByteArrayOutputStream buffer = new ByteArrayOutputStream(8192);
        private int status = 200;
        private String contentType;

        private CorpoCapturado(HttpServletResponse response) {
            super(response);
        }

        @Override
        public ServletOutputStream getOutputStream() {
            return new ServletOutputStream() {
                @Override
                public void write(int b) {
                    buffer.write(b);
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setWriteListener(WriteListener listener) {
                }
            };
        }

        @Override
        public PrintWriter getWriter() throws UnsupportedEncodingException {
            return new PrintWriter(new OutputStreamWriter(buffer, StandardCharsets.UTF_8));
        }

        @Override
        public void setStatus(int sc) {
            this.status = sc;
            super.setStatus(sc);
        }

        @Override
        public void setContentType(String type) {
            this.contentType = type;
            super.setContentType(type);
        }
    }
}
