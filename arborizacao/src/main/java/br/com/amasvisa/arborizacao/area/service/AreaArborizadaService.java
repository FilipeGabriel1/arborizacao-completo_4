package br.com.amasvisa.arborizacao.area.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;
import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.area.models.AreaArborizadaRequest;
import br.com.amasvisa.arborizacao.area.models.AreaArborizadaResponse;
import br.com.amasvisa.arborizacao.area.models.AreaFoto;
import br.com.amasvisa.arborizacao.area.models.AreaFotoRequest;
import br.com.amasvisa.arborizacao.area.models.AreaFotoResponse;
import br.com.amasvisa.arborizacao.area.models.PontoGeografico;
import br.com.amasvisa.arborizacao.area.models.PontoGeograficoDTO;
import br.com.amasvisa.arborizacao.area.repository.AreaArborizadaRepository;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import jakarta.persistence.EntityNotFoundException;

@Service
public class AreaArborizadaService {

    private final AreaArborizadaRepository repository;
    private final AuditoriaService auditoriaService;

    public AreaArborizadaService(AreaArborizadaRepository repository, AuditoriaService auditoriaService) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    public AreaArborizadaResponse criar(AreaArborizadaRequest request) {
        validarCoordenadas(request);

        AreaArborizada area = new AreaArborizada();
        area.setNome(request.nome());
        area.setDescricao(request.descricao());
        area.setFotoUrl(request.fotoUrl());
        area.setTipo(request.tipo());
        area.setStatus(request.status());
        area.setLatitude(request.latitude());
        area.setLongitude(request.longitude());
        area.setPontos(convertirPontos(request.pontos()));
        atualizarFotos(area, request.fotos());
        area.prepararPersistencia();

        AreaArborizadaResponse response = toResponse(repository.save(area));
        auditoriaService.registrar(TipoEntidadeAuditoria.AREA, response.id(), AcaoAuditoria.CRIACAO,
                "Área criada: " + response.nome());
        return response;
    }

    public PaginaResponse<AreaArborizadaResponse> listar(String nome, Pageable pageable) {
        if (nome == null || nome.isBlank()) {
            return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
        }
        return PaginaResponse.of(repository.findByNomeContainingIgnoreCase(nome, pageable).map(this::toResponse));
    }

    public AreaArborizadaResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public AreaArborizadaResponse atualizar(Long id, AreaArborizadaRequest request) {
        validarCoordenadas(request);

        AreaArborizada area = obterEntidade(id);
        area.setNome(request.nome());
        area.setDescricao(request.descricao());
        area.setFotoUrl(request.fotoUrl());
        area.setTipo(request.tipo());
        area.setStatus(request.status());
        area.setLatitude(request.latitude());
        area.setLongitude(request.longitude());
        area.setPontos(convertirPontos(request.pontos()));
        atualizarFotos(area, request.fotos());
        area.prepararPersistencia();

        AreaArborizadaResponse response = toResponse(repository.save(area));
        auditoriaService.registrar(TipoEntidadeAuditoria.AREA, response.id(), AcaoAuditoria.EDICAO,
                "Área atualizada: " + response.nome());
        return response;
    }

    public void remover(Long id) {
        AreaArborizada area = obterEntidade(id);
        repository.delete(area);
        auditoriaService.registrar(TipoEntidadeAuditoria.AREA, id, AcaoAuditoria.EXCLUSAO,
                "Área excluída: " + area.getNome());
    }

    private AreaArborizada obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Área arborizada não encontrada: " + id));
    }

    private void validarCoordenadas(AreaArborizadaRequest request) {
        boolean temPontoIndividual = request.latitude() != null && request.longitude() != null;
        boolean temPoligono = request.pontos() != null && !request.pontos().isEmpty();

        if (!temPontoIndividual && !temPoligono) {
            throw new IllegalArgumentException("Informe latitude/longitude ou uma lista de pontos.");
        }
    }

    private void atualizarFotos(AreaArborizada area, List<AreaFotoRequest> fotos) {
        area.getFotos().clear();
        if (fotos == null) {
            return;
        }

        for (AreaFotoRequest fotoRequest : fotos) {
            AreaFoto foto = new AreaFoto();
            foto.setArea(area);
            foto.setUrl(fotoRequest.url());
            foto.setDescricao(fotoRequest.descricao());
            foto.prepararPersistencia();
            area.getFotos().add(foto);
        }
    }

    private List<PontoGeografico> convertirPontos(List<PontoGeograficoDTO> pontos) {
        if (pontos == null) {
            return new ArrayList<>();
        }
        // IMPORTANTE: não usar .toList() aqui — ele devolve uma lista imutável,
        // e o Hibernate precisa poder alterar essa coleção internamente ao
        // salvar (@ElementCollection). Uma lista imutável causa
        // UnsupportedOperationException no flush.
        List<PontoGeografico> resultado = new ArrayList<>();
        for (PontoGeograficoDTO ponto : pontos) {
            resultado.add(new PontoGeografico(ponto.latitude(), ponto.longitude()));
        }
        return resultado;
    }

    private AreaArborizadaResponse toResponse(AreaArborizada area) {
        List<PontoGeograficoDTO> pontos = area.getPontos().stream()
                .map(ponto -> new PontoGeograficoDTO(ponto.getLatitude(), ponto.getLongitude()))
                .toList();

        List<AreaFotoResponse> fotos = area.getFotos().stream()
                .map(foto -> new AreaFotoResponse(foto.getId(), foto.getUrl(), foto.getDescricao(), foto.getCriadoEm()))
                .toList();

        return new AreaArborizadaResponse(
                area.getId(),
                area.getNome(),
                area.getDescricao(),
                area.getFotoUrl(),
                area.getTipo(),
                area.getStatus(),
                area.getLatitude(),
                area.getLongitude(),
                pontos,
                fotos,
                area.getCriadoEm(),
                area.getAtualizadoEm()
        );
    }
}