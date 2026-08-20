package br.com.amasvisa.arborizacao.arvore.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;
import br.com.amasvisa.arborizacao.arvore.models.EspecieArvoreRequest;
import br.com.amasvisa.arborizacao.arvore.models.EspecieArvoreResponse;
import br.com.amasvisa.arborizacao.arvore.models.EspecieFoto;
import br.com.amasvisa.arborizacao.arvore.models.EspecieFotoRequest;
import br.com.amasvisa.arborizacao.arvore.models.EspecieFotoResponse;
import br.com.amasvisa.arborizacao.arvore.repository.EspecieArvoreRepository;
import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import jakarta.persistence.EntityNotFoundException;

@Service
public class EspecieArvoreService {

    private final EspecieArvoreRepository repository;
    private final AuditoriaService auditoriaService;

    public EspecieArvoreService(EspecieArvoreRepository repository, AuditoriaService auditoriaService) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    public EspecieArvoreResponse criar(EspecieArvoreRequest request) {
        EspecieArvore especie = new EspecieArvore();
        especie.setNomePopular(request.nomePopular());
        especie.setNomeCientifico(request.nomeCientifico());
        especie.setFamilia(request.familia());
        especie.setPortePadrao(request.portePadrao());
        especie.setObservacoes(request.observacoes());
        especie.setIndicacaoPlantio(request.indicacaoPlantio());
        especie.setFotoUrl(request.fotoUrl());
        atualizarFotos(especie, request.fotos());
        especie.prepararPersistencia();

        EspecieArvoreResponse response = toResponse(repository.save(especie));
        auditoriaService.registrar(TipoEntidadeAuditoria.ESPECIE, response.id(), AcaoAuditoria.CRIACAO,
                "Espécie criada: " + response.nomePopular());
        return response;
    }

    public PaginaResponse<EspecieArvoreResponse> listar(String nomePopular, Pageable pageable) {
        if (nomePopular == null || nomePopular.isBlank()) {
            return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
        }

        return PaginaResponse.of(repository.findByNomePopularContainingIgnoreCase(nomePopular, pageable).map(this::toResponse));
    }

    public EspecieArvoreResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public EspecieArvoreResponse atualizar(Long id, EspecieArvoreRequest request) {
        EspecieArvore especie = obterEntidade(id);
        especie.setNomePopular(request.nomePopular());
        especie.setNomeCientifico(request.nomeCientifico());
        especie.setFamilia(request.familia());
        especie.setPortePadrao(request.portePadrao());
        especie.setObservacoes(request.observacoes());
        especie.setIndicacaoPlantio(request.indicacaoPlantio());
        especie.setFotoUrl(request.fotoUrl());
        atualizarFotos(especie, request.fotos());
        especie.prepararPersistencia();

        EspecieArvoreResponse response = toResponse(repository.save(especie));
        auditoriaService.registrar(TipoEntidadeAuditoria.ESPECIE, response.id(), AcaoAuditoria.EDICAO,
                "Espécie atualizada: " + response.nomePopular());
        return response;
    }

    public void remover(Long id) {
        EspecieArvore especie = obterEntidade(id);
        repository.delete(especie);
        auditoriaService.registrar(TipoEntidadeAuditoria.ESPECIE, id, AcaoAuditoria.EXCLUSAO,
                "Espécie excluída: " + especie.getNomePopular());
    }

    public EspecieArvore obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Espécie de árvore não encontrada: " + id));
    }

    private void atualizarFotos(EspecieArvore especie, List<EspecieFotoRequest> fotos) {
        especie.getFotos().clear();
        if (fotos == null) {
            return;
        }

        for (EspecieFotoRequest fotoRequest : fotos) {
            EspecieFoto foto = new EspecieFoto();
            foto.setEspecie(especie);
            foto.setUrl(fotoRequest.url());
            foto.setDescricao(fotoRequest.descricao());
            foto.prepararPersistencia();
            especie.getFotos().add(foto);
        }
    }

    private EspecieArvoreResponse toResponse(EspecieArvore especie) {
        List<EspecieFotoResponse> fotos = especie.getFotos().stream()
                .map(foto -> new EspecieFotoResponse(foto.getId(), foto.getUrl(), foto.getDescricao(), foto.getCriadoEm()))
                .toList();

        return new EspecieArvoreResponse(
                especie.getId(),
                especie.getNomePopular(),
                especie.getNomeCientifico(),
                especie.getFamilia(),
                especie.getPortePadrao(),
                especie.getObservacoes(),
                especie.getIndicacaoPlantio(),
                especie.getFotoUrl(),
                fotos,
                especie.getCriadoEm(),
                especie.getAtualizadoEm()
        );
    }
}