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
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
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
                        "/arborizacao/mapa-publico.js",
                        "/arborizacao/styles.css",
                        "/login"
                ).permitAll()
                // Consultas públicas (somente leitura) para usuários normais.
                // Doações ficam de fora por conter dados de cidadãos (doadores).
                .requestMatchers(HttpMethod.GET,
                        "/api/areas/**",
                        "/api/arvores/**",
                        "/api/especies/**",
                        "/api/places/**"
                ).permitAll()
                .requestMatchers("/api/auth/me").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/arborizacao/login.html")
                .loginProcessingUrl("/login")
                .usernameParameter("email")
                .passwordParameter("senha")
                .defaultSuccessUrl("/arborizacao/cadastro-areas.html", true)
                .failureUrl("/arborizacao/login.html?erro=1")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/arborizacao/login.html?saiu=1")
                .permitAll()
            )
            // Front-end estático (sem template engine), então não há como
            // embutir o token CSRF automaticamente nos formulários/fetch.
            // Como é uma ferramenta interna, atrás de login, desativamos o
            // CSRF por completo em vez de só nas rotas /api/**.
            .csrf(csrf -> csrf.disable())
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
            );

        return http.build();
    }
}