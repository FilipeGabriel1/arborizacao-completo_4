package br.com.amasvisa.arborizacao.doacao.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import br.com.amasvisa.arborizacao.arvore.repository.ArvoreRepository;
import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvore;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvoreRequest;
import br.com.amasvisa.arborizacao.doacao.models.DoacaoArvoreResponse;
import br.com.amasvisa.arborizacao.doacao.repository.DoacaoArvoreRepository;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import jakarta.persistence.EntityNotFoundException;

@Service
public class DoacaoArvoreService {

    private final DoacaoArvoreRepository repository;
    private final ArvoreRepository arvoreRepository;
    private final AuditoriaService auditoriaService;

    public DoacaoArvoreService(DoacaoArvoreRepository repository, ArvoreRepository arvoreRepository,
            AuditoriaService auditoriaService) {
        this.repository = repository;
        this.arvoreRepository = arvoreRepository;
        this.auditoriaService = auditoriaService;
    }

    public DoacaoArvoreResponse criar(DoacaoArvoreRequest request) {
        DoacaoArvore doacao = new DoacaoArvore();
        doacao.setArvore(obterArvore(request.arvoreId()));
        doacao.setDescricao(request.descricao());
        doacao.setSolicitante(request.solicitante());
        doacao.setDataDoacao(request.dataDoacao());
        doacao.setDestinacao(request.destinacao());

        DoacaoArvoreResponse response = toResponse(repository.save(doacao));
        auditoriaService.registrar(TipoEntidadeAuditoria.DOACAO, response.id(), AcaoAuditoria.CRIACAO,
                "Doação registrada: " + detalheDoacao(response.solicitante()));
        return response;
    }

    public PaginaResponse<DoacaoArvoreResponse> listar(Pageable pageable) {
        return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
    }

    public DoacaoArvoreResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public DoacaoArvoreResponse atualizar(Long id, DoacaoArvoreRequest request) {
        DoacaoArvore doacao = obterEntidade(id);
        doacao.setArvore(obterArvore(request.arvoreId()));
        doacao.setDescricao(request.descricao());
        doacao.setSolicitante(request.solicitante());
        doacao.setDataDoacao(request.dataDoacao());
        doacao.setDestinacao(request.destinacao());

        DoacaoArvoreResponse response = toResponse(repository.save(doacao));
        auditoriaService.registrar(TipoEntidadeAuditoria.DOACAO, response.id(), AcaoAuditoria.EDICAO,
                "Doação atualizada: " + detalheDoacao(response.solicitante()));
        return response;
    }

    public void remover(Long id) {
        DoacaoArvore doacao = obterEntidade(id);
        repository.delete(doacao);
        auditoriaService.registrar(TipoEntidadeAuditoria.DOACAO, id, AcaoAuditoria.EXCLUSAO,
                "Doação excluída: " + detalheDoacao(doacao.getSolicitante()));
    }

    private String detalheDoacao(String solicitante) {
        return (solicitante == null || solicitante.isBlank()) ? "sem solicitante informado" : solicitante;
    }

    private DoacaoArvore obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Doação não encontrada: " + id));
    }

    private Arvore obterArvore(Long arvoreId) {
        return arvoreRepository.findById(arvoreId)
                .orElseThrow(() -> new EntityNotFoundException("Árvore não encontrada: " + arvoreId));
    }

    private DoacaoArvoreResponse toResponse(DoacaoArvore doacao) {
        return new DoacaoArvoreResponse(
                doacao.getId(),
                doacao.getArvore() != null ? doacao.getArvore().getId() : null,
                doacao.getArvore() != null ? doacao.getArvore().getNome() : null,
                doacao.getDescricao(),
                doacao.getSolicitante(),
                doacao.getDataDoacao(),
                doacao.getDestinacao()
        );
    }
}
