package br.com.amasvisa.arborizacao.config;

import org.apache.catalina.connector.Connector;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.beans.factory.annotation.Value;

/**
 * Ativa o modo HTTPS quando {@code server.ssl.enabled=true} (usado junto com
 * o keystore gerado pelo mkcert em ./config/arborizacao.p12):
 *
 *  - a aplicação passa a escutar em HTTPS na porta principal (8443);
 *  - um conector HTTP extra continua na porta 8080 e apenas redireciona
 *    toda requisição para https://<host>:8443 (hábito de digitar
 *    http://localhost:8080 continua funcionando).
 *
 * Sem server.ssl.enabled=true (máquinas sem o keystore, testes), nada muda:
 * a aplicação segue em HTTP puro na porta 8080.
 */
@Configuration
@ConditionalOnProperty(name = "server.ssl.enabled", havingValue = "true")
public class HttpsRedirectConfig {

    @Value("${server.port:8443}")
    private int httpsPort;

    @Value("${app.https.http-port:8080}")
    private int httpPort;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpRedirectConnectorCustomizer() {
        return factory -> {
            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setPort(httpPort);
            connector.setScheme("http");
            connector.setSecure(false);
            factory.addAdditionalConnectors(connector);
        };
    }

    @Bean
    public FilterRegistrationBean<HttpsRedirectFilter> httpsRedirectFilter() {
        FilterRegistrationBean<HttpsRedirectFilter> registration =
                new FilterRegistrationBean<>(new HttpsRedirectFilter(httpsPort));
        // Antes de tudo (inclusive do Spring Security): qualquer requisição
        // que chegar por HTTP pura é enviada para HTTPS imediatamente.
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
