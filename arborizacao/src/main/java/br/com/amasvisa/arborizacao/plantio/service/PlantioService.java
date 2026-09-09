package br.com.amasvisa.arborizacao.plantio.service;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.amasvisa.arborizacao.area.models.AreaArborizada;
import br.com.amasvisa.arborizacao.area.service.AreaArborizadaService;
import br.com.amasvisa.arborizacao.arvore.models.EspecieArvore;
import br.com.amasvisa.arborizacao.arvore.service.EspecieArvoreService;
import br.com.amasvisa.arborizacao.comum.PaginaResponse;
import br.com.amasvisa.arborizacao.plantio.models.Plantio;
import br.com.amasvisa.arborizacao.plantio.models.PlantioRequest;
import br.com.amasvisa.arborizacao.plantio.models.PlantioResponse;
import br.com.amasvisa.arborizacao.plantio.repository.PlantioRepository;
import jakarta.persistence.EntityNotFoundException;

@Service
public class PlantioService {

    private final PlantioRepository repository;
    private final AreaArborizadaService areaService;
    private final EspecieArvoreService especieService;

    public PlantioService(PlantioRepository repository, AreaArborizadaService areaService,
            EspecieArvoreService especieService) {
        this.repository = repository;
        this.areaService = areaService;
        this.especieService = especieService;
    }

    public PlantioResponse criar(PlantioRequest request) {
        Plantio plantio = new Plantio();
        aplicarRequest(plantio, request);
        return toResponse(repository.save(plantio));
    }

    public PaginaResponse<PlantioResponse> listar(Pageable pageable) {
        return PaginaResponse.of(repository.findAll(pageable).map(this::toResponse));
    }

    public PlantioResponse buscarPorId(Long id) {
        return toResponse(obterEntidade(id));
    }

    public PlantioResponse atualizar(Long id, PlantioRequest request) {
        Plantio plantio = obterEntidade(id);
        aplicarRequest(plantio, request);
        return toResponse(repository.save(plantio));
    }

    public void remover(Long id) {
        Plantio plantio = obterEntidade(id);
        repository.delete(plantio);
    }

    private void aplicarRequest(Plantio plantio, PlantioRequest request) {
        AreaArborizada area = request.areaId() == null ? null : areaService.obterEntidade(request.areaId());
        EspecieArvore especie = request.especieId() == null ? null : especieService.obterEntidade(request.especieId());
        plantio.setArea(area);
        plantio.setEspecie(especie);
        plantio.setQuantidadeMudas(request.quantidadeMudas());
        plantio.setDataPlantio(request.dataPlantio());
        plantio.setResponsavel(request.responsavel());
        plantio.setDescricao(request.descricao());
        plantio.setStatus(request.status());
        plantio.prepararPersistencia();
    }

    private Plantio obterEntidade(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Plantio não encontrado: " + id));
    }

    private PlantioResponse toResponse(Plantio plantio) {
        return new PlantioResponse(
                plantio.getId(),
                plantio.getArea() == null ? null : plantio.getArea().getId(),
                plantio.getArea() == null ? null : plantio.getArea().getNome(),
                plantio.getEspecie() == null ? null : plantio.getEspecie().getId(),
                plantio.getEspecie() == null ? null : plantio.getEspecie().getNomePopular(),
                plantio.getQuantidadeMudas(),
                plantio.getDataPlantio(),
                plantio.getResponsavel(),
                plantio.getDescricao(),
                plantio.getStatus(),
                plantio.getCriadoEm(),
                plantio.getAtualizadoEm()
        );
    }
}
