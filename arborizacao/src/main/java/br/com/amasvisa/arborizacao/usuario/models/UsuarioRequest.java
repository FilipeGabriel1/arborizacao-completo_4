package br.com.amasvisa.arborizacao.usuario.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres") String senha,
        @NotNull PerfilUsuario perfil
) {
}
