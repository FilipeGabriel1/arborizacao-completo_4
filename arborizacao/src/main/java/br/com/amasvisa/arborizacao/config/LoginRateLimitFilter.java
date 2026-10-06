package br.com.amasvisa.arborizacao.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Bloqueia POST /login quando o par IP + e-mail excedeu o número de
 * tentativas falhas permitidas (ver {@link LoginAttemptService}).
 *
 * Responde 429 com uma página HTML simples (o form do navegador mostra
 * a mensagem em vez de uma tela branca).
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final LoginAttemptService tentativas;

    public LoginRateLimitFilter(LoginAttemptService tentativas) {
        this.tentativas = tentativas;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        boolean postLogin = "POST".equalsIgnoreCase(request.getMethod())
                && "/login".equals(request.getRequestURI());
        if (!postLogin) {
            filterChain.doFilter(request, response);
            return;
        }

        String chave = LoginAttemptService.chave(request.getRemoteAddr(), request.getParameter("email"));
        if (!tentativas.bloqueado(chave)) {
            filterChain.doFilter(request, response);
            return;
        }

        long minutos = tentativas.minutosRestantes(chave);
        response.setStatus(429);
        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write("""
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Muitas tentativas de login</title>
                  <style>
                    body { font-family: Inter, Arial, sans-serif; background:#0f172a; color:#e5e7eb;
                           display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
                    .caixa { background:#111827; border:1px solid #1f2937; border-radius:14px;
                             padding:32px 36px; max-width:420px; text-align:center; }
                    h1 { font-size:1.15rem; margin:0 0 10px; color:#f87171; }
                    p { font-size:0.92rem; line-height:1.5; margin:0 0 18px; color:#9ca3af; }
                    a { color:#34d399; font-weight:600; text-decoration:none; }
                    a:hover { text-decoration:underline; }
                  </style>
                </head>
                <body>
                  <div class="caixa">
                    <h1>Muitas tentativas de login</h1>
                    <p>Por segurança, o acesso foi bloqueado temporariamente após várias
                       tentativas falhas.<br />Tente novamente em aproximadamente %d minuto(s).</p>
                    <a href="/arborizacao/login.html">Voltar ao login</a>
                  </div>
                </body>
                </html>
                """.formatted(Math.max(1, minutos)));
    }
}
