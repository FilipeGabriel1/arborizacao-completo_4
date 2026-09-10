package br.com.amasvisa.arborizacao.manutencao.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.manutencao.models.ManutencaoArvore;
import br.com.amasvisa.arborizacao.manutencao.models.ManutencaoArvoreRequest;
import br.com.amasvisa.arborizacao.manutencao.models.ManutencaoArvoreResponse;
import br.com.amasvisa.arborizacao.manutencao.repository.ManutencaoArvoreRepository;
import jakarta.persistence.EntityNotFoundException;

@Service
public class ManutencaoArvoreService {

    private final ManutencaoArvoreRepository repository;

    public ManutencaoArvoreService(ManutencaoArvoreRepository repository) {
        this.repository = repository;
    }

    public ManutencaoArvoreResponse criar(ManutencaoArvoreRequest request) {
        ManutencaoArvore manutencao = new ManutencaoArvore();
        aplicarRequest(manutencao, request);
        return toResponse(repository.save(manutencao));
    }

    public PaginaResponse<ManutencaoArvoreResponse> listar(Pageable pageable) {
        return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
    }

    public ManutencaoArvoreResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public ManutencaoArvoreResponse atualizar(Long id, ManutencaoArvoreRequest request) {
        ManutencaoArvore manutencao = obterEntidade(id);
        aplicarRequest(manutencao, request);
        return toResponse(repository.save(manutencao));
    }

    public void remover(Long id) {
        ManutencaoArvore manutencao = obterEntidade(id);
        repository.delete(manutencao);
    }

    private void aplicarRequest(ManutencaoArvore manutencao, ManutencaoArvoreRequest request) {
        manutencao.setEndereco(request.endereco());
        manutencao.setTipo(request.tipo());
        manutencao.setPrioridade(request.prioridade());
        manutencao.setDataAgendada(request.dataAgendada());
        manutencao.setDataExecucao(request.dataExecucao());
        manutencao.setResponsavelExecucao(request.responsavelExecucao());
        manutencao.setObservacoes(request.observacoes());
        manutencao.setStatus(request.status());
        manutencao.prepararPersistencia();
    }

    private ManutencaoArvore obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Manutenção não encontrada: " + id));
    }

    private ManutencaoArvoreResponse toResponse(ManutencaoArvore m) {
        return new ManutencaoArvoreResponse(
                m.getId(),
                m.getEndereco(),
                m.getTipo(),
                m.getPrioridade(),
                m.getDataAgendada(),
                m.getDataExecucao(),
                m.getResponsavelExecucao(),
                m.getObservacoes(),
                m.getStatus(),
                m.getCriadoEm(),
                m.getAtualizadoEm()
        );
    }
}
