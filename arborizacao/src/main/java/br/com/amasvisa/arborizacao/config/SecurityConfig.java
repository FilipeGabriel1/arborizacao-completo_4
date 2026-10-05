package br.com.amasvisa.arborizacao.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Autenticação por sessão (cookie), com login em formulário HTML.
 *
 * O sistema tem duas áreas:
 *  1) Área pública (usuários da cidade, SEM login): o mapa e a listagem
 *     das áreas arborizadas com as informações da área e das árvores.
 *     Somente consultas (GET) ficam liberadas.
 *  2) Área interna (funcionários, COM login): cadastro/edição de áreas,
 *     árvores, espécies, doações e usuários. Qualquer escrita
 *     (POST/PUT/PATCH/DELETE) e as telas internas exigem login.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, LoginAttemptService tentativas,
            LoginRateLimitFilter loginRateLimitFilter) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Área pública: tela inicial de entrada, página do mapa,
                // estilos, login e a raiz (que redireciona para a entrada).
                .requestMatchers(
                        "/",
                        "/index.html",
                        "/arborizacao",
                        "/arborizacao/",
                        "/arborizacao/entrar.html",
                        "/arborizacao/login.html",
                        "/arborizacao/index.html",
                        "/arborizacao/especies-publico.html",
                        "/arborizacao/especies-publico.js",
                        "/arborizacao/areas-publico.html",
                        "/arborizacao/areas-publico.js",
                        "/arborizacao/mapa-publico.js",
                        "/arborizacao/painel-arvore.js",
                        "/arborizacao/styles.css",
                        "/arborizacao/csrf.js",
                        "/arborizacao/acessibilidade.js",
                        "/arborizacao/cookie-consent.js",
                        "/arborizacao/kml.js",
                        "/arborizacao/favicon.svg",
                        "/arborizacao/img/**",
                        "/arborizacao/sementeira.html",
                        "/arborizacao/indicadores.html",
                        "/arborizacao/sobre.html",
                        "/arborizacao/historico-publico.html",
                        "/arborizacao/politica-privacidade.html",
                        "/arborizacao/termos-de-uso.html",
                        "/arborizacao/direitos-titular.html",
                        "/arborizacao/especie-det.html",
                        "/arborizacao/especie-det.js",
                        "/arborizacao/area-det.html",
                        "/arborizacao/area-det.js",
                        "/api/csrf",
                        "/login"
                ).permitAll()
                // Consultas públicas (somente leitura) para usuários normais.
                // Doações ficam de fora por conter dados de cidadãos (doadores).
                .requestMatchers(HttpMethod.GET,
                        "/api/areas/**",
                        "/api/arvores/**",
                        "/api/especies/**",
                        "/api/placar/**",
                        "/api/places/**",
                        "/api/sementeira/**",
                        "/api/kml/export/**"
                ).permitAll()
                // --- Autorização por perfil (validada no servidor, não só no front) ---
                // Perfil ORDENS: somente ordens de serviço (leitura + criação/atualização);
                // não pode apagar ordens nem tocar em cadastros.
                .requestMatchers(HttpMethod.POST, "/api/manutencoes/**")
                        .hasAnyRole("FUNCIONARIO", "ADMIN", "ORDENS")
                .requestMatchers(HttpMethod.PUT, "/api/manutencoes/**")
                        .hasAnyRole("FUNCIONARIO", "ADMIN", "ORDENS")
                // Qualquer outra escrita (POST/PUT/PATCH/DELETE) exige funcionário ou admin.
                .requestMatchers(HttpMethod.POST, "/api/**").hasAnyRole("FUNCIONARIO", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/**").hasAnyRole("FUNCIONARIO", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/**").hasAnyRole("FUNCIONARIO", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("FUNCIONARIO", "ADMIN")
                // Doações contêm CPF/RG de cidadãos: perfil ORDENS não acessa.
                .requestMatchers("/api/doacoes/**").hasAnyRole("FUNCIONARIO", "ADMIN")
                .requestMatchers("/api/auth/me").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/arborizacao/login.html")
                .loginProcessingUrl("/login")
                .usernameParameter("email")
                .passwordParameter("senha")
                // Falha: conta falha no contador do rate limit e redireciona
                // para a página de login com a mensagem de erro.
                .failureHandler((request, response, exception) -> {
                    tentativas.registraFalha(
                            LoginAttemptService.chave(request.getRemoteAddr(), request.getParameter("email")));
                    response.sendRedirect("/arborizacao/login.html?erro=1");
                })
                // Sucesso: zera o contador e vai para o painel.
                .successHandler((request, response, authentication) -> {
                    tentativas.limpa(
                            LoginAttemptService.chave(request.getRemoteAddr(), request.getParameter("email")));
                    response.sendRedirect("/arborizacao/painel.html");
                })
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/arborizacao/login.html?saiu=1")
                .permitAll()
            )
            // Front-end estático (sem template engine): o token CSRF é
            // entregue em um cookie não-HttpOnly (XSRF-TOKEN) e o script
            // /arborizacao/csrf.js o envia de volta como header X-XSRF-TOKEN
            // (e como campo _csrf nos formulários, como o de login/logout).
            // Usamos o CsrfTokenRequestAttributeHandler (sem mascaramento XOR)
            // porque o valor do cookie é enviado de forma crua no header.
            .csrf(csrf -> csrf
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            .exceptionHandling(ex -> ex
                // Chamadas fetch para /api/** que não estiverem autenticadas
                // recebem 401 em vez de serem redirecionadas para o HTML de login.
                .defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        request -> request.getRequestURI().startsWith("/api/")
                )
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(3)
            )
            // Rate limit de login: corta POST /login antes da autenticação
            // quando o par IP + e-mail está bloqueado (429).
            .addFilterBefore(loginRateLimitFilter,
                    org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
            // Cabeçalhos de segurança: HSTS (efetivo quando atrás de HTTPS)
            // e Referrer-Policy para não vazar a URL completa em links externos.
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(15552000))
                .referrerPolicy(referrer -> referrer
                        .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            );

        return http.build();
    }
}