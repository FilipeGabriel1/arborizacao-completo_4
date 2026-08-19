package br.com.amasvisa.arborizacao.config;

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
 * IMPORTANTE: troque essa senha assim que fizer o primeiro login,
 * usando a própria tela de usuários ("Editar" → nova senha).
 */
@Configuration
public class DataSeedConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSeedConfig.class);
    private static final String EMAIL_PADRAO = "admin@amasvisa.com.br";
    private static final String SENHA_PADRAO = "TrocarSenha123";

    @Bean
    public CommandLineRunner seedAdminPadrao(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            Usuario admin = new Usuario();
            admin.setNome("Administrador");
            admin.setEmail(EMAIL_PADRAO);
            admin.setSenha(passwordEncoder.encode(SENHA_PADRAO));
            admin.setPerfil(PerfilUsuario.ADMIN);
            admin.setAtivo(true);
            admin.prepararPersistencia();
            repository.save(admin);

            log.warn("Usuário administrador padrão criado -> e-mail: {} | senha: {} (TROQUE após o primeiro login!)",
                    EMAIL_PADRAO, SENHA_PADRAO);
        };
    }
}
