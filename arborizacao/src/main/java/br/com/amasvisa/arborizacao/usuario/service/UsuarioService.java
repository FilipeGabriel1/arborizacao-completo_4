package br.com.amasvisa.arborizacao.usuario.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.usuario.models.Usuario;
import br.com.amasvisa.arborizacao.usuario.models.UsuarioRequest;
import br.com.amasvisa.arborizacao.usuario.models.UsuarioResponse;
import br.com.amasvisa.arborizacao.usuario.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder passwordEncoder, AuditoriaService auditoriaService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }

    public UsuarioResponse criar(UsuarioRequest request) {
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("Já existe um usuário cadastrado com este e-mail.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        usuario.setSenha(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(request.perfil());
        usuario.setAtivo(true);
        usuario.prepararPersistencia();

        UsuarioResponse response = toResponse(repository.save(usuario));
        auditoriaService.registrar(TipoEntidadeAuditoria.USUARIO, response.id(), AcaoAuditoria.CRIACAO,
                "Usuário criado: " + response.email() + " (" + response.perfil() + ")");
        return response;
    }

    public List<UsuarioResponse> listar() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public UsuarioResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public UsuarioResponse atualizarStatus(Long id, boolean ativo) {
        Usuario usuario = obterEntidade(id);
        usuario.setAtivo(ativo);
        UsuarioResponse response = toResponse(repository.save(usuario));
        auditoriaService.registrar(TipoEntidadeAuditoria.USUARIO, response.id(), AcaoAuditoria.EDICAO,
                "Usuário " + (ativo ? "ativado" : "desativado") + ": " + response.email());
        return response;
    }

    public UsuarioResponse redefinirSenha(Long id, String novaSenha) {
        Usuario usuario = obterEntidade(id);
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        UsuarioResponse response = toResponse(repository.save(usuario));
        auditoriaService.registrar(TipoEntidadeAuditoria.USUARIO, response.id(), AcaoAuditoria.EDICAO,
                "Senha redefinida: " + response.email());
        return response;
    }

    public void remover(Long id) {
        Usuario usuario = obterEntidade(id);
        repository.delete(usuario);
        auditoriaService.registrar(TipoEntidadeAuditoria.USUARIO, id, AcaoAuditoria.EXCLUSAO,
                "Usuário excluído: " + usuario.getEmail());
    }

    private Usuario obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + id));
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                usuario.isAtivo(),
                usuario.getCriadoEm()
        );
    }
}
