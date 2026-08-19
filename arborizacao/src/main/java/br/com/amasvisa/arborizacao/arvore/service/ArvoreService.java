package br.com.amasvisa.arborizacao.arvore.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;
import br.com.amasvisa.arborizacao.area.repository.AreaArborizadaRepository;
import br.com.amasvisa.arborizacao.arvore.models.Arvore;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreFoto;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreFotoRequest;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreFotoResponse;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreRequest;
import br.com.amasvisa.arborizacao.arvore.models.ArvoreResponse;
import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;
import br.com.amasvisa.arborizacao.arvore.repository.ArvoreRepository;
import br.com.amasvisa.arborizacao.auditoria.models.AcaoAuditoria;
import br.com.amasvisa.arborizacao.auditoria.models.TipoEntidadeAuditoria;
import br.com.amasvisa.arborizacao.auditoria.service.AuditoriaService;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import jakarta.persistence.EntityNotFoundException;

@Service
public class ArvoreService {

    private final ArvoreRepository repository;
    private final AreaArborizadaRepository areaRepository;
    private final EspecieArvoreService especieService;
    private final AuditoriaService auditoriaService;

    public ArvoreService(ArvoreRepository repository, AreaArborizadaRepository areaRepository,
            EspecieArvoreService especieService, AuditoriaService auditoriaService) {
        this.repository = repository;
        this.areaRepository = areaRepository;
        this.especieService = especieService;
        this.auditoriaService = auditoriaService;
    }

    public ArvoreResponse criar(ArvoreRequest request) {
        Arvore arvore = new Arvore();
        aplicarRequest(arvore, request);
        ArvoreResponse response = toResponse(repository.save(arvore));
        auditoriaService.registrar(TipoEntidadeAuditoria.ARVORE, response.id(), AcaoAuditoria.CRIACAO,
                "Árvore criada: " + detalheArvore(response.nome()));
        return response;
    }

    public PaginaResponse<ArvoreResponse> listar(Long areaId, Long especieId, String nome, Pageable pageable) {
        Page<Arvore> pagina;
        if (areaId != null) {
            pagina = repository.findByArea_Id(areaId, pageable);
        } else if (especieId != null) {
            pagina = repository.findByEspecie_Id(especieId, pageable);
        } else if (nome != null && !nome.isBlank()) {
            pagina = repository.findByNomeContainingIgnoreCase(nome, pageable);
        } else {
            pagina = repository.findAll(pageable);
        }

        return PaginaResponse.of(pagina.map(this::toResponse));
    }

    public ArvoreResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public ArvoreResponse atualizar(Long id, ArvoreRequest request) {
        Arvore arvore = obterEntidade(id);
        aplicarRequest(arvore, request);
        ArvoreResponse response = toResponse(repository.save(arvore));
        auditoriaService.registrar(TipoEntidadeAuditoria.ARVORE, response.id(), AcaoAuditoria.EDICAO,
                "Árvore atualizada: " + detalheArvore(response.nome()));
        return response;
    }

    public void remover(Long id) {
        Arvore arvore = obterEntidade(id);
        repository.delete(arvore);
        auditoriaService.registrar(TipoEntidadeAuditoria.ARVORE, id, AcaoAuditoria.EXCLUSAO,
                "Árvore excluída: " + detalheArvore(arvore.getNome()));
    }

    private String detalheArvore(String nome) {
        return (nome == null || nome.isBlank()) ? "árvore sem nome" : nome;
    }

    private void aplicarRequest(Arvore arvore, ArvoreRequest request) {
        AreaArborizada area = request.areaId() == null ? null : areaRepository.findById(request.areaId())
                .orElseThrow(() -> new EntityNotFoundException("Área arborizada não encontrada: " + request.areaId()));
        EspecieArvore especie = request.especieId() == null ? null : especieService.obterEntidade(request.especieId());

        arvore.setArea(area);
        arvore.setEspecie(especie);
        arvore.setNome(request.nome());
        arvore.setTipoArvore(request.tipoArvore());
        arvore.setPorte(request.porte());
        arvore.setOrigem(request.origem());
        arvore.setStatus(request.status());
        arvore.setGeorreferenciada(request.georreferenciada());
        arvore.setLatitude(request.latitude());
        arvore.setLongitude(request.longitude());
        arvore.setDataPlantio(request.dataPlantio());
        arvore.setNumeroProcesso(request.numeroProcesso());
        arvore.setDescricao(request.descricao());
        arvore.setFotoUrl(request.fotoUrl());
        atualizarFotos(arvore, request.fotos());
        arvore.prepararPersistencia();
    }

    private void atualizarFotos(Arvore arvore, List<ArvoreFotoRequest> fotos) {
        arvore.getFotos().clear();
        if (fotos == null) {
            return;
        }

        for (ArvoreFotoRequest fotoRequest : fotos) {
            ArvoreFoto foto = new ArvoreFoto();
            foto.setArvore(arvore);
            foto.setUrl(fotoRequest.url());
            foto.setDescricao(fotoRequest.descricao());
            foto.prepararPersistencia();
            arvore.getFotos().add(foto);
        }
    }

    private Arvore obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Árvore não encontrada: " + id));
    }

    private ArvoreResponse toResponse(Arvore arvore) {
        List<ArvoreFotoResponse> fotos = arvore.getFotos().stream()
                .map(foto -> new ArvoreFotoResponse(foto.getId(), foto.getUrl(), foto.getDescricao(), foto.getCriadoEm()))
                .toList();

        return new ArvoreResponse(
                arvore.getId(),
                arvore.getArea() == null ? null : arvore.getArea().getId(),
                arvore.getArea() == null ? null : arvore.getArea().getNome(),
                arvore.getEspecie() == null ? null : arvore.getEspecie().getId(),
                arvore.getEspecie() == null ? null : arvore.getEspecie().getNomePopular(),
                arvore.getNome(),
                arvore.getTipoArvore(),
                arvore.getPorte(),
                arvore.getOrigem(),
                arvore.getStatus(),
                arvore.isGeorreferenciada(),
                arvore.getLatitude(),
                arvore.getLongitude(),
                arvore.getDataPlantio(),
                arvore.getNumeroProcesso(),
                arvore.getDescricao(),
                arvore.getFotoUrl(),
                fotos,
                arvore.getCriadoEm(),
                arvore.getAtualizadoEm()
        );
    }
}