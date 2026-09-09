package br.com.amasvisa.arborizacao.sementeira.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;
import br.com.amasvisa.arborizacao.arvore.service.EspecieArvoreService;
import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.sementeira.models.LoteSementeira;
import br.com.amasvisa.arborizacao.sementeira.models.LoteSementeiraRequest;
import br.com.amasvisa.arborizacao.sementeira.models.LoteSementeiraResponse;
import br.com.amasvisa.arborizacao.sementeira.repository.LoteSementeiraRepository;
import jakarta.persistence.EntityNotFoundException;

@Service
public class LoteSementeiraService {

    private final LoteSementeiraRepository repository;
    private final EspecieArvoreService especieService;
    private final AuditoriaService auditoriaService;

    public LoteSementeiraService(LoteSementeiraRepository repository, EspecieArvoreService especieService,
            AuditoriaService auditoriaService) {
        this.repository = repository;
        this.especieService = especieService;
        this.auditoriaService = auditoriaService;
    }

    public LoteSementeiraResponse criar(LoteSementeiraRequest request) {
        LoteSementeira lote = new LoteSementeira();
        aplicarRequest(lote, request);
        LoteSementeiraResponse response = toResponse(repository.save(lote));
        auditoriaService.registrar(TipoEntidadeAuditoria.ARVORE, response.id(), AcaoAuditoria.CRIACAO,
                "Lote de sementeira criado: " + response.numeroLote());
        return response;
    }

    public PaginaResponse<LoteSementeiraResponse> listar(Pageable pageable) {
        return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
    }

    public LoteSementeiraResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public LoteSementeiraResponse atualizar(Long id, LoteSementeiraRequest request) {
        LoteSementeira lote = obterEntidade(id);
        aplicarRequest(lote, request);
        LoteSementeiraResponse response = toResponse(repository.save(lote));
        auditoriaService.registrar(TipoEntidadeAuditoria.ARVORE, response.id(), AcaoAuditoria.EDICAO,
                "Lote de sementeira atualizado: " + response.numeroLote());
        return response;
    }

    public void remover(Long id) {
        LoteSementeira lote = obterEntidade(id);
        repository.delete(lote);
        auditoriaService.registrar(TipoEntidadeAuditoria.ARVORE, id, AcaoAuditoria.EXCLUSAO,
                "Lote de sementeira excluído: " + lote.getNumeroLote());
    }

    private void aplicarRequest(LoteSementeira lote, LoteSementeiraRequest request) {
        EspecieArvore especie = request.especieId() == null ? null : especieService.obterEntidade(request.especieId());
        lote.setNumeroLote(request.numeroLote());
        lote.setEspecie(especie);
        lote.setQuantidadeProduzida(request.quantidadeProduzida());
        lote.setQuantidadeDisponivel(request.quantidadeDisponivel() != null ? request.quantidadeDisponivel() : request.quantidadeProduzida());
        lote.setQuantidadeDoadas(request.quantidadeDoadas() != null ? request.quantidadeDoadas() : 0);
        lote.setQuantidadePlantadas(request.quantidadePlantadas() != null ? request.quantidadePlantadas() : 0);
        lote.setQuantidadePerdas(request.quantidadePerdas() != null ? request.quantidadePerdas() : 0);
        lote.setDataProducao(request.dataProducao());
        lote.setOrigemSementes(request.origemSementes());
        lote.setObservacoes(request.observacoes());
        lote.setStatus(request.status());
        lote.prepararPersistencia();
    }

    private LoteSementeira obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lote de sementeira não encontrado: " + id));
    }

    private LoteSementeiraResponse toResponse(LoteSementeira lote) {
        return new LoteSementeiraResponse(
                lote.getId(),
                lote.getNumeroLote(),
                lote.getEspecie() == null ? null : lote.getEspecie().getId(),
                lote.getEspecie() == null ? null : lote.getEspecie().getNomePopular(),
                lote.getQuantidadeProduzida(),
                lote.getQuantidadeDisponivel(),
                lote.getQuantidadeDoadas(),
                lote.getQuantidadePlantadas(),
                lote.getQuantidadePerdas(),
                lote.getDataProducao(),
                lote.getOrigemSementes(),
                lote.getObservacoes(),
                lote.getStatus(),
                lote.getCriadoEm(),
                lote.getAtualizadoEm()
        );
    }
}
