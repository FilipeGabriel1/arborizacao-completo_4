package br.com.amasvisa.arborizacao.usuario.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.amasvisa.arborizacao.usuario.models.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
