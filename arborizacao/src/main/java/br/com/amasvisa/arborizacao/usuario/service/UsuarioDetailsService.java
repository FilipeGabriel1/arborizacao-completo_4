package br.com.amasvisa.arborizacao.usuario.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.usuario.models.Usuario;
import br.com.amasvisa.arborizacao.usuario.repository.UsuarioRepository;

/**
 * Carrega o usuário pelo e-mail para o Spring Security durante o login.
 * O e-mail é usado como "username" no formulário de login.
 */
@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository repository;

    public UsuarioDetailsService(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("E-mail ou senha inválidos"));

        return org.springframework.security.core.userdetails.User
                .withUsername(usuario.getEmail())
                .password(usuario.getSenha())
                .authorities("ROLE_" + usuario.getPerfil().name())
                .disabled(!usuario.isAtivo())
                .build();
    }
}
