package br.com.amasvisa.arborizacao.auditoria.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.AuditoriaResponse;
import br.com.amasvisa.arborizacao.auditoria.models.RegistroAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.repository.AuditoriaRepository;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;

@Service
public class AuditoriaService {

    private final AuditoriaRepository repository;

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    public void registrar(TipoEntidadeAuditoria entidade, Long entidadeId, AcaoAuditoria acao, String detalhe) {
        try {
            RegistroAuditoria registro = new RegistroAuditoria();
            registro.setDataHora(LocalDateTime.now());
            registro.setUsuarioEmail(usuarioAtual());
            registro.setEntidade(entidade);
            registro.setEntidadeId(entidadeId);
            registro.setAcao(acao);
            registro.setDetalhe(detalhe);
            repository.save(registro);
        } catch (Exception exception) {
            // A auditoria nunca pode quebrar a operação principal.
            exception.printStackTrace();
        }
    }

    private String usuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    public PaginaResponse<AuditoriaResponse> listar(Pageable pageable) {
        return PaginaResponse.of(repository.findAllByOrderByDataHoraDesc(pageable).map(registro -> new AuditoriaResponse(
                        registro.getId(),
                        registro.getDataHora(),
                        registro.getUsuarioEmail(),
                        registro.getAcao(),
                        registro.getEntidade(),
                        registro.getEntidadeId(),
                        registro.getDetalhe()
                )));
    }
}