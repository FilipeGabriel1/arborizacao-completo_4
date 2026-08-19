package br.com.amasvisa.arborizacao.usuario.models;

import java.time.LocalDateTime;

public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        PerfilUsuario perfil,
        boolean ativo,
        LocalDateTime criadoEm
) {
}
