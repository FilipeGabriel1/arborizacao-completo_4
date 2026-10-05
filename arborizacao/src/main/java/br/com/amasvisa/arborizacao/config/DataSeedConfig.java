package br.com.amasvisa.arborizacao.config;

import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import br.com.amasvisa.arborizacao.usuario.models.PerfilUsuario;
import br.com.amasvisa.arborizacao.usuario.models.Usuario;
import br.com.amasvisa.arborizacao.usuario.repository.UsuarioRepository;

/**
 * Na primeira execução (tabela `usuarios` vazia), cria um administrador
 * padrão para você conseguir entrar e cadastrar os demais funcionários
 * pela tela /arborizacao/usuarios.html.
 *
 * A senha vem da variável de ambiente ADMIN_SENHA; se não houver, uma
 * senha forte é gerada aleatoriamente e exibida uma única vez no log
 * (nada de senha fixa no código-fonte).
 */
@Configuration
public class DataSeedConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSeedConfig.class);
    private static final String EMAIL_PADRAO = "admin@amasvisa.com.br";

    @Bean
    public CommandLineRunner seedAdminPadrao(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            String senha = System.getenv("ADMIN_SENHA");
            if (senha == null || senha.isBlank()) {
                senha = senhaAleatoria();
            }

            Usuario admin = new Usuario();
            admin.setNome("Administrador");
            admin.setEmail(EMAIL_PADRAO);
            admin.setSenha(passwordEncoder.encode(senha));
            admin.setPerfil(PerfilUsuario.ADMIN);
            admin.setAtivo(true);
            admin.prepararPersistencia();
            repository.save(admin);

            log.warn("Usuário administrador padrão criado -> e-mail: {}", EMAIL_PADRAO);
            log.warn("Senha do administrador (guarde e troque após o primeiro login): {}", senha);
        };
    }

    /** 16 caracteres URL-safe (~95 bits de entropia). */
    private static String senhaAleatoria() {
        byte[] bytes = new byte[12];
        new java.security.SecureRandom().nextBytes(bytes);
        return "Adm" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
